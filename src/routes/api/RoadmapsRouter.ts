import Paths from '@src/routes/constants/Paths';
import { Router } from 'express';
import {
  RequestWithSession,
  requireSessionMiddleware,
} from '@src/middleware/session';
import HttpStatusCodes from '@src/constants/HttpStatusCodes';
import { IRoadmap, Roadmap } from '@src/models/Roadmap';
import Database from '@src/util/DatabaseDriver';
import GetRouter from '@src/routes/api/Roadmaps/RoadmapsGet';
import UpdateRouter from '@src/routes/api/Roadmaps/RoadmapsUpdate';
import * as console from 'console';
import RoadmapIssues from '@src/routes/api/Roadmaps/RoadmapIssues';
import RoadmapTabsInfo from '@src/routes/api/Roadmaps/RoadmapsTabsInfo';
import envVars from '@src/constants/EnvVars';
import { NodeEnvs } from '@src/constants/misc';

const RoadmapsRouter = Router();

RoadmapsRouter.post(Paths.Roadmaps.Create, requireSessionMiddleware);
RoadmapsRouter.post(
  Paths.Roadmaps.Create,
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

      let roadmapDataJson: IRoadmap;
      if (typeof roadmapData !== 'string') roadmapDataJson = roadmapData;
      else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        roadmapDataJson = JSON.parse(roadmapData);
      }

      roadmapDataJson.ownerId = session?.userId || BigInt(-1);
      roadmapDataJson.id = undefined;

      // if Title is empty, edit it to be "Untitled Roadmap"
      if (roadmapDataJson.name === '') {
        roadmapDataJson.name = 'Untitled';
      }

      // convert date strings to date objects
      roadmapDataJson.createdAt = new Date(roadmapDataJson.createdAt);
      roadmapDataJson.updatedAt = new Date(roadmapDataJson.updatedAt);

      // FIX to make this work without workaround

      roadmap = Roadmap.from(roadmapDataJson);
    } catch (e) {
      if (envVars.NodeEnv !== NodeEnvs.Test) console.log(e);
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ error: 'Roadmap is not a valid roadmap object.' });
    }

    //check if session exists
    if (!session)
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Session is missing from user.' });

    // get database connection
    const db = new Database();

    // save roadmap to database
    const id = await db.insert('roadmaps', roadmap);

    // check if id is valid
    if (id < 0)
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Roadmap could not be saved to database.' });

    // return id
    return res.status(HttpStatusCodes.CREATED).json({ id: id.toString() });
  },
);

RoadmapsRouter.use(Paths.Roadmaps.Get.Base, GetRouter);

RoadmapsRouter.use(Paths.Roadmaps.Update.Base, UpdateRouter);

RoadmapsRouter.delete(Paths.Roadmaps.Delete, requireSessionMiddleware);
RoadmapsRouter.delete(
  Paths.Roadmaps.Delete,
  async (req: RequestWithSession, res) => {
    // get data from body and session
    const session = req.session;
    const id = BigInt(req.params.roadmapId || -1);

    // check if id is valid
    if (id < 0)
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ error: 'Roadmap id is missing.' });

    // check if session exists
    if (!session)
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Session is missing from user.' });

    // get database connection
    const db = new Database();

    // check if roadmap exists
    const roadmap = await db.get<Roadmap>('roadmaps', id);
    if (!roadmap)
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ error: 'Roadmap does not exist.' });

    // check if the user is owner
    if (roadmap.ownerId !== session?.userId)
      return res
        .status(HttpStatusCodes.FORBIDDEN)
        .json({ error: 'User is not the owner of the roadmap.' });

    // delete roadmap from database
    const success = await db.delete('roadmaps', id);

    // check if id is valid
    if (!success)
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Roadmap could not be deleted from database.' });

    // return id
    return res.status(HttpStatusCodes.OK).json({ success: true });
  },
);

RoadmapsRouter.use(Paths.Roadmaps.Issues.Base, RoadmapIssues);
RoadmapsRouter.use(Paths.Roadmaps.TabsInfo.Base, RoadmapTabsInfo);

/*
 ! like roadmaps
 */
RoadmapsRouter.all(Paths.Roadmaps.Like, requireSessionMiddleware);

RoadmapsRouter.get(
  Paths.Roadmaps.Like,
  async (req: RequestWithSession, res) => {
    // get data from body and session
    const session = req.session;
    const id = BigInt(req.params.roadmapId || -1);

    // check if id is valid
    if (id < 0)
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ error: 'Roadmap id is missing.' });

    // check if session exists
    if (!session)
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Session is missing from user.' });

    // get database connection
    const db = new Database();

    // check if roadmap exists
    const roadmap = await db.get<Roadmap>('roadmaps', id);
    if (!roadmap)
      return res
        .status(HttpStatusCodes.NOT_FOUND)
        .json({ error: 'Roadmap does not exist.' });

    // check if user has already liked the roadmap
    const liked = await db.getAllWhere<{ roadmapId: bigint; userId: bigint }>(
      'roadmapLikes',
      'userId',
      session.userId.toString(),
    );

    // check if likes exist
    if (!liked) return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR);

    if (liked.some((like) => like.roadmapId === id))
      return res
        .status(HttpStatusCodes.FORBIDDEN)
        .json({ error: 'User has already liked the roadmap.' });

    // like roadmap
    const success = await db.insert('roadmapLikes', {
      roadmapId: id,
      userId: session.userId,
    });

    // check if id is valid
    if (success < 0)
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Roadmap could not be liked.' });

    // return
    return res.status(HttpStatusCodes.OK).json({ success: true });
  },
);

RoadmapsRouter.delete(
  Paths.Roadmaps.Like,
  async (req: RequestWithSession, res) => {
    // get data from body and session
    const session = req.session;
    const id = BigInt(req.params.roadmapId || -1);

    // check if id is valid
    if (id < 0)
      return res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ error: 'Roadmap id is missing.' });

    // check if session exists
    if (!session)
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Session is missing from user.' });

    // get database connection
    const db = new Database();

    // check if roadmap exists
    const roadmap = await db.get<Roadmap>('roadmaps', id);
    if (!roadmap) return res.status(HttpStatusCodes.NOT_FOUND);

    // check if user has already liked the roadmap
    const liked = await db.getAllWhere<{
      id: bigint;
      roadmapId: bigint;
      userId: bigint;
    }>('roadmapLikes', 'userId', session.userId.toString());

    // check if likes exist
    if (!liked)
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Roadmap likes could not be retrieved from database.' });

    // find id of roadmap liked
    const likedRoadmap = liked.find((like) => like.roadmapId === id);

    // check if user has liked the roadmap
    if (!likedRoadmap)
      return res
        .status(HttpStatusCodes.FORBIDDEN)
        .json({ error: 'User has not liked the roadmap.' });

    // delete roadmap like
    const success = await db.delete('roadmapLikes', likedRoadmap.id);

    // check if id is valid
    if (!success)
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Roadmap like could not be deleted from database.' });

    // return success
    return res.status(HttpStatusCodes.OK).json({ success: true });
  },
);

export default RoadmapsRouter;
