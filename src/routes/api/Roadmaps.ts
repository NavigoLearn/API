import Paths from '@src/routes/constants/Paths';
import { Router } from 'express';
import {
  RequestWithSession,
  requireSessionMiddleware,
} from '@src/middleware/session';
import HttpStatusCodes from '@src/constants/HttpStatusCodes';
import { IRoadmap, Roadmap } from '@src/models/Roadmap';
import Database from '@src/util/DatabaseDriver';
import GetRouter from '@src/routes/api/Roadmaps/Get';
import Upate from '@src/routes/api/Roadmaps/Upate';
import * as console from 'console';

const RoadmapsRouter = Router();

RoadmapsRouter.post(Paths.Roadmaps.Create, requireSessionMiddleware);
RoadmapsRouter.post(Paths.Roadmaps.Create,
  async (req: RequestWithSession, res) => {
    //get data from body and session
    let roadmap;
    const session = req.session;

    // check if the roadmap is valid
    try {
      // eslint-disable-next-line max-len
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
      const roadmapData = req.body?.roadmap as string;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const roadmapDataJson: IRoadmap = JSON.parse(roadmapData);

      roadmapDataJson.ownerId = session?.userId || BigInt(-1);
      roadmapDataJson.id = undefined;

      // convert date strings to date objects
      roadmapDataJson.createdAt = new Date(roadmapDataJson.createdAt);
      roadmapDataJson.updatedAt = new Date(roadmapDataJson.updatedAt);

      roadmap = Roadmap.from(roadmapDataJson);
    } catch (e) {
      console.log(e);
      return res.sendStatus(HttpStatusCodes.BAD_REQUEST)
        .json({ error: 'Roadmap is not a valid roadmap object.' });
    }

    //check if session exists
    if (!session) return res.sendStatus(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'Session is missing from user.' });

    // get database connection
    const db = new Database();

    // save roadmap to database
    const id = await db.insert('roadmaps', roadmap);

    // check if id is valid
    if (id < 0) return res.sendStatus(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'Roadmap could not be saved to database.' });

    // return id
    return res.status(HttpStatusCodes.OK).json({ id: id.toString() });
  });

RoadmapsRouter.use(Paths.Roadmaps.Get.Base, GetRouter);

RoadmapsRouter.use(Paths.Roadmaps.Update.Base, Upate);

RoadmapsRouter.delete(Paths.Roadmaps.Delete, requireSessionMiddleware);
RoadmapsRouter.delete(Paths.Roadmaps.Delete,
  async (req: RequestWithSession, res) => {
    // get data from body and session
    const session = req.session;
    const id = BigInt(req.params.roadmapId || -1);

    // check if id is valid
    if (id < 0) return res.sendStatus(HttpStatusCodes.BAD_REQUEST)
      .json({ error: 'Roadmap id is missing.' });

    // check if session exists
    if (!session) return res.sendStatus(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'Session is missing from user.' });

    // get database connection
    const db = new Database();

    // check if roadmap exists
    const roadmap = await db.get<Roadmap>('roadmaps', id);
    if (!roadmap) return res.sendStatus(HttpStatusCodes.NOT_FOUND)
      .json({ error: 'Roadmap does not exist.' });

    // check if the user is owner
    if (roadmap.ownerId !== session?.userId)
      return res.sendStatus(HttpStatusCodes.FORBIDDEN)
        .json({ error: 'User is not the owner of the roadmap.' });

    // delete roadmap from database
    const success = await db.delete('roadmaps', id);

    // check if id is valid
    if (!success) return res.sendStatus(HttpStatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: 'Roadmap could not be deleted from database.' });

    // return id
    return res.status(HttpStatusCodes.OK).json({ success: true });
  });

export default RoadmapsRouter;