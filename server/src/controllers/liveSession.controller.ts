import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { getAuthUser } from '../utils/requestContext';
import { ApiError } from '../utils/ApiError';
import { LiveSession } from '../models/LiveSession.model';
import { Enrollment } from '../models/Enrollment.model';
import { LiveSessionService } from '../services/liveSession.service';
import { NotificationService } from '../services/notification.service';
import { emitToTenant } from '../config/socket';

export const LiveSessionController = {
  upcoming: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const items = await LiveSessionService.upcomingForUser(user.tenantId, user.id);
    ApiResponse.success(res, items, 'Upcoming live sessions');
  }),

  create: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const session = await LiveSession.create({
      tenantId: user.tenantId,
      instructorId: user.id,
      ...req.body,
    });
    ApiResponse.created(res, session.toObject(), 'Live session created');
  }),

  list: asyncHandler(async (req, res) => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) throw ApiError.badRequest('Tenant context required');
    const sessions = await LiveSession.find({
      tenantId,
      status: 'scheduled',
      scheduledAt: { $gte: new Date() },
    })
      .sort({ scheduledAt: 1 })
      .limit(20)
      .lean();
    ApiResponse.success(res, sessions, 'Live sessions');
  }),

  get: asyncHandler(async (req, res) => {
    const tenantId = req.tenantId ?? req.user?.tenantId;
    if (!tenantId) throw ApiError.badRequest('Tenant context required');
    const session = await LiveSession.findOne({ _id: req.params.id, tenantId }).lean();
    if (!session) throw ApiError.notFound('Live session not found');
    ApiResponse.success(res, session, 'Live session');
  }),

  update: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const session = await LiveSession.findOne({
      _id: req.params.id,
      tenantId: user.tenantId,
      instructorId: user.id,
    });
    if (!session) throw ApiError.notFound('Live session not found');
    if (session.status !== 'scheduled') {
      throw ApiError.badRequest('Cannot update a session that has already started');
    }
    Object.assign(session, req.body);
    await session.save();
    ApiResponse.success(res, session.toObject(), 'Live session updated');
  }),

  cancel: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const filter = isAdmin
      ? { _id: req.params.id, tenantId: user.tenantId }
      : { _id: req.params.id, tenantId: user.tenantId, instructorId: user.id };
    await LiveSession.deleteOne(filter);
    ApiResponse.noContent(res);
  }),

  start: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const session = await LiveSession.findOne({
      _id: req.params.id,
      tenantId: user.tenantId,
      instructorId: user.id,
    });
    if (!session) throw ApiError.notFound('Live session not found');

    session.status = 'live';
    await session.save();

    // Notify all enrolled students
    const enrollments = await Enrollment.find({
      tenantId: user.tenantId,
      courseId: session.courseId,
      status: 'active',
    })
      .select('userId')
      .lean();

    if (enrollments.length > 0) {
      // Per-user create so each enrolled student gets a real-time push.
      await Promise.allSettled(
        enrollments.map((e) =>
          NotificationService.create(user.tenantId, e.userId.toString(), {
            type: 'live',
            title: 'Live session starting now',
            body: session.title,
            link: session.meetingUrl,
          }),
        ),
      );
    }

    // Broadcast to the whole tenant so live-session lists flip to "live now".
    emitToTenant(user.tenantId, 'live_session_started', {
      sessionId: session._id.toString(),
      title: session.title,
      courseId: session.courseId.toString(),
    });

    ApiResponse.success(res, session.toObject(), 'Session started — students notified');
  }),

  end: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const session = await LiveSession.findOne({
      _id: req.params.id,
      tenantId: user.tenantId,
      instructorId: user.id,
    });
    if (!session) throw ApiError.notFound('Live session not found');
    session.status = 'ended';
    await session.save();
    ApiResponse.success(res, session.toObject(), 'Session ended');
  }),

  join: asyncHandler(async (req, res) => {
    const user = getAuthUser(req);
    const session = await LiveSession.findOne({
      _id: req.params.id,
      tenantId: user.tenantId,
      status: 'live',
    }).lean();
    if (!session) throw ApiError.notFound('Live session not found or not currently live');

    // Verify enrollment
    const enrolled = await Enrollment.exists({
      tenantId: user.tenantId,
      courseId: session.courseId,
      userId: user.id,
      status: 'active',
    });
    if (!enrolled) throw ApiError.forbidden('You must be enrolled to join this session');

    // Track attendee (idempotent)
    await LiveSession.updateOne(
      { _id: session._id },
      { $addToSet: { attendees: user.id } },
    );

    ApiResponse.success(res, { meetingUrl: session.meetingUrl }, 'Joined session');
  }),
};
