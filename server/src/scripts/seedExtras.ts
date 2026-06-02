import { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { Tenant } from '../models/Tenant.model';
import { User } from '../models/User.model';
import { Course } from '../models/Course.model';
import { Review } from '../models/Review.model';
import { LiveSession } from '../models/LiveSession.model';
import { logger } from '../utils/logger';

const AVATAR = (seed: string): string =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=100&h=100&q=70`;

const STUDENTS = [
  { name: 'Maya Chen', email: 'maya@demo.test', avatar: AVATAR('photo-1494790108377-be9c29b29330') },
  { name: 'Omar Farouk', email: 'omar@demo.test', avatar: AVATAR('photo-1500648767791-00dcc994a43e') },
  { name: 'Lena Park', email: 'lena@demo.test', avatar: AVATAR('photo-1438761681033-6461ffad8d80') },
];

const COMMENTS = [
  'Genuinely one of the best courses I have taken — clear, practical, and well-paced.',
  'The projects made everything click. I shipped real work by the end.',
  'Excellent instructor. Complex topics explained simply, with great examples.',
  'Exceeded my expectations. The lessons are concise and the quizzes reinforce the material.',
  'Loved the hands-on approach. Highly recommend to anyone starting out.',
];

async function seedExtras(): Promise<void> {
  await connectDB();
  const tenant = await Tenant.findOne({ slug: 'demo' }).lean<{ _id: Types.ObjectId } | null>();
  if (!tenant) throw new Error('Demo tenant not found — run `npm run seed:tenant` first.');
  const tenantId = tenant._id;

  const instructor = await User.findOne({ tenantId, role: 'instructor' }).select('_id').lean();
  const courses = await Course.find({ tenantId, isPublished: true })
    .select('_id title')
    .sort({ createdAt: 1 })
    .lean();
  if (courses.length === 0 || !instructor) {
    throw new Error('No courses/instructor found — run `npm run seed:courses` first.');
  }

  // Reviewer students.
  const students = [];
  for (const s of STUDENTS) {
    let user = await User.findOne({ tenantId, email: s.email });
    if (!user) {
      user = await User.create({
        tenantId,
        name: s.name,
        email: s.email,
        password: 'Password123',
        role: 'student',
        isVerified: true,
        avatar: s.avatar,
      });
    }
    students.push(user);
  }

  // Clean re-seed of reviews + live sessions for this tenant.
  await Promise.all([Review.deleteMany({ tenantId }), LiveSession.deleteMany({ tenantId })]);

  let reviewCount = 0;
  for (const [ci, course] of courses.entries()) {
    // 1–2 reviews per course from rotating students.
    for (let i = 0; i < 2; i += 1) {
      const student = students[(ci + i) % students.length];
      const rating = i === 0 ? 5 : 4;
      await Review.create({
        tenantId,
        userId: student._id,
        courseId: course._id,
        rating,
        comment: COMMENTS[(ci + i) % COMMENTS.length],
        isVerified: true,
      });
      reviewCount += 1;
    }
    // Recompute the course's aggregate rating from its reviews.
    const [agg] = await Review.aggregate<{ avg: number; count: number }>([
      { $match: { courseId: course._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Course.updateOne(
      { _id: course._id },
      { $set: { 'rating.average': Math.round((agg?.avg ?? 0) * 10) / 10, 'rating.count': agg?.count ?? 0 } },
    );
  }

  // Upcoming live sessions for the first three courses.
  const now = Date.now();
  for (const [i, course] of courses.slice(0, 3).entries()) {
    await LiveSession.create({
      tenantId,
      courseId: course._id,
      instructorId: instructor._id,
      title: `Live Q&A: ${course.title}`,
      scheduledAt: new Date(now + (i + 2) * 24 * 60 * 60 * 1000),
      duration: 60,
      meetingUrl: 'https://meet.example.com/nextlearn-demo',
      status: 'scheduled',
    });
  }

  logger.info(`✅ Seeded ${reviewCount} reviews and 3 upcoming live sessions for tenant "demo"`);
  await disconnectDB();
}

seedExtras().catch((err) => {
  logger.error({ err }, 'Failed to seed extras');
  process.exit(1);
});
