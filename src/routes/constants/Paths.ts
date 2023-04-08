/**
 * Express router paths go here.
 */

import { Immutable } from '@src/other/types';

const Paths = {
  Base: '/api',
  Auth: {
    Base: '/auth',
    Login: '/login',
    Register: '/register',
    ChangePassword: '/change-password',
    ForgotPassword: '/forgot-password',
    GoogleLogin: '/google-login',
    GoogleCallback: '/google-callback',
    GithubLogin: '/github-login',
    GithubCallback: '/github-callback',
    Logout: '/logout',
  },
  Explore: {
    Base: '/explore',
    New: '/new',
    Popular: '/popular',
    Trending: '/trending',
    Search: {
      Base: '/search',
      Users: '/users',
      Roadmaps: '/roadmaps',
    },
  },
  Roadmaps: {
    Base: '/roadmaps',
    Create: '/create',
    Get: '/:roadmapId',
    Update: '/:roadmapId',
    Delete: '/:roadmapId',
    Progress: {
      Base: '/:roadmapId/progress',
      Get: '/:userId?',
      Update: '/',
    },
    Rating: {
      Base: '/:roadmapId/rating',
      Get: '/:own?', // get rating of roadmap or own rating
      Update: '/',
      Delete: '/',
    },
    Issues: {
      Base: '/:id/issues',
      Create: '/create',
      Get: '/:issueId?', // get all issues or one issue
      Update: '/:issueId',
      Close: '/:issueId',
      Comments: {
        Base: '/:issueId/comments',
        Create: '/create',
        Get: '/:commentId?',
        Update: '/:commentId',
        Delete: '/:commentId',
      },
    },
  },
  Users: {
    Base: '/users',
    Get: {
      Base: '/:userId([0-9]+)?',
      Profile: '/',
      MiniProfile: '/mini',
      UserRoadmaps: '/roadmaps',
      UserIssues: '/issues',
      UserFollowers: '/followers',
      UserFollowing: '/following',
      RoadmapCount: '/roadmap-count',
      IssueCount: '/issue-count',
      FollowerCount: '/follower-count',
      FollowingCount: '/following-count',
    },
    Update: {
      Base: '/:userId([0-9]+)?',
      ProfilePicture: '/profile-picture',
      Bio: '/bio',
      Quote: '/quote',
      Name: '/name',
      BlogUrl: '/blog-url',
      WebsiteUrl: '/website-url',
      GithubUrl: '/github-url',
      Email: '/email',
    },
    Delete: '/:userId?',
  },
};

// **** Export **** //

export type TPaths = Immutable<typeof Paths>;
export default Paths as TPaths;
