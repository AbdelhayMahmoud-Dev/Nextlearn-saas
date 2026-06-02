import { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { Tenant } from '../models/Tenant.model';
import { User } from '../models/User.model';
import { Course } from '../models/Course.model';
import { Module } from '../models/Module.model';
import { Lesson } from '../models/Lesson.model';
import { logger } from '../utils/logger';

const HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const THUMBS = (seed: string): string => `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=70`;

interface SeedCourse {
  title: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  salePrice?: number;
  featured?: boolean;
  thumb: string;
  description: string;
  outcomes: string[];
  modules: { title: string; lessons: { title: string; free?: boolean; minutes: number; article?: boolean }[] }[];
}

const COURSES: SeedCourse[] = [
  {
    title: 'Full-Stack Web Development with Next.js',
    category: 'Development',
    level: 'intermediate',
    price: 89.99,
    salePrice: 49.99,
    featured: true,
    thumb: 'photo-1517180102446-f3ece451e9d8',
    description: 'Build and ship production-grade full-stack apps with Next.js, TypeScript, and MongoDB.',
    outcomes: ['Build full-stack apps with Next.js', 'Design REST APIs', 'Deploy to production', 'Write type-safe code'],
    modules: [
      { title: 'Getting Started', lessons: [{ title: 'Course Introduction', free: true, minutes: 6 }, { title: 'Setting Up Your Environment', free: true, minutes: 12 }] },
      { title: 'Building the Frontend', lessons: [{ title: 'App Router Fundamentals', minutes: 18 }, { title: 'Data Fetching Patterns', minutes: 22 }, { title: 'Styling with Tailwind', minutes: 15, article: true }] },
      { title: 'The Backend', lessons: [{ title: 'Designing the API', minutes: 20 }, { title: 'Authentication', minutes: 25 }] },
    ],
  },
  {
    title: 'UI/UX Design Foundations',
    category: 'Design',
    level: 'beginner',
    price: 0,
    featured: true,
    thumb: 'photo-1561070791-2526d30994b5',
    description: 'Learn the principles of user-centered design, from research to high-fidelity prototypes.',
    outcomes: ['Apply design principles', 'Run user research', 'Build prototypes in Figma'],
    modules: [
      { title: 'Design Principles', lessons: [{ title: 'What is UX?', free: true, minutes: 8 }, { title: 'Visual Hierarchy', free: true, minutes: 14 }] },
      { title: 'Prototyping', lessons: [{ title: 'Wireframing Basics', minutes: 16 }, { title: 'From Wireframe to Prototype', minutes: 19 }] },
    ],
  },
  {
    title: 'Data Science & Machine Learning Bootcamp',
    category: 'Data Science',
    level: 'advanced',
    price: 129.99,
    thumb: 'photo-1551288049-bebda4e38f71',
    description: 'A rigorous, project-based path through Python, statistics, and modern ML.',
    outcomes: ['Master Python for data', 'Build ML models', 'Evaluate and tune models'],
    modules: [
      { title: 'Python for Data', lessons: [{ title: 'NumPy & Pandas', free: true, minutes: 24 }, { title: 'Data Visualization', minutes: 20 }] },
      { title: 'Machine Learning', lessons: [{ title: 'Regression', minutes: 28 }, { title: 'Classification', minutes: 30 }, { title: 'Model Evaluation', minutes: 22, article: true }] },
    ],
  },
  {
    title: 'Digital Marketing Masterclass',
    category: 'Marketing',
    level: 'beginner',
    price: 59.99,
    salePrice: 39.99,
    thumb: 'photo-1460925895917-afdab827c52f',
    description: 'Grow any brand with SEO, content, email, and paid acquisition that actually converts.',
    outcomes: ['Build a marketing funnel', 'Run paid campaigns', 'Grow organic traffic'],
    modules: [
      { title: 'Foundations', lessons: [{ title: 'The Marketing Funnel', free: true, minutes: 10 }, { title: 'Audience Research', minutes: 15 }] },
      { title: 'Channels', lessons: [{ title: 'SEO Essentials', minutes: 18 }, { title: 'Email Marketing', minutes: 16 }] },
    ],
  },
  {
    title: 'Photography: From Beginner to Pro',
    category: 'Photography',
    level: 'beginner',
    price: 44.99,
    thumb: 'photo-1452587925148-ce544e77e70d',
    description: 'Master your camera, composition, and post-processing to capture stunning images.',
    outcomes: ['Understand exposure', 'Compose striking shots', 'Edit like a pro'],
    modules: [
      { title: 'Camera Basics', lessons: [{ title: 'Exposure Triangle', free: true, minutes: 12 }, { title: 'Lenses Explained', minutes: 14 }] },
      { title: 'Editing', lessons: [{ title: 'Lightroom Workflow', minutes: 20 }] },
    ],
  },
  {
    title: 'Startup Finance & Fundraising',
    category: 'Business',
    level: 'intermediate',
    price: 74.99,
    thumb: 'photo-1554224155-6726b3ff858f',
    description: 'Understand the numbers that run a startup, and how to raise capital with confidence.',
    outcomes: ['Read financial statements', 'Build a model', 'Pitch investors'],
    modules: [
      { title: 'Finance Fundamentals', lessons: [{ title: 'Financial Statements', free: true, minutes: 16 }, { title: 'Unit Economics', minutes: 18 }] },
      { title: 'Fundraising', lessons: [{ title: 'The Cap Table', minutes: 20 }, { title: 'Pitching Investors', minutes: 22, article: true }] },
    ],
  },
  {
    title: 'Artificial Intelligence: From Zero to Builder',
    category: 'ai-ml',
    level: 'beginner',
    price: 0,
    featured: true,
    thumb: 'photo-1677442135703-1787eea5ce01',
    description:
      'Your complete beginner path into Artificial Intelligence. You will learn what AI is, how machine learning works under the hood, and build your first real AI models in Python — no PhD required. By the end you will be able to train classifiers, work with data, and understand how modern AI applications are built.',
    outcomes: [
      'Explain the difference between AI, Machine Learning, and Deep Learning',
      'Set up a Python AI development environment',
      'Load, clean, and explore datasets with Pandas',
      'Train and evaluate a classification model with scikit-learn',
      'Understand how neural networks learn',
      'Build a simple image classifier with TensorFlow/Keras',
      'Apply AI thinking to real-world problems',
    ],
    modules: [
      {
        title: 'AI Foundations',
        lessons: [
          { title: 'What Is Artificial Intelligence?', free: true, minutes: 12 },
          { title: 'AI vs Machine Learning vs Deep Learning', free: true, minutes: 10 },
          { title: 'How Machines Learn: The Big Picture', minutes: 14 },
          { title: 'Setting Up Python for AI (Jupyter + Anaconda)', minutes: 18, article: true },
        ],
      },
      {
        title: 'Working with Data',
        lessons: [
          { title: 'Loading Datasets with Pandas', free: true, minutes: 16 },
          { title: 'Exploring and Visualizing Data', minutes: 20 },
          { title: 'Cleaning Messy Data', minutes: 18 },
          { title: 'Feature Engineering Basics', minutes: 22 },
        ],
      },
      {
        title: 'Your First Machine Learning Model',
        lessons: [
          { title: 'Introduction to scikit-learn', minutes: 15 },
          { title: 'Training a Classification Model', minutes: 25 },
          { title: 'Evaluating Model Performance', minutes: 20 },
          { title: 'Overfitting, Underfitting, and Cross-Validation', minutes: 22, article: true },
        ],
      },
      {
        title: 'Neural Networks & Deep Learning',
        lessons: [
          { title: 'How Neural Networks Actually Work', minutes: 20 },
          { title: 'Introduction to TensorFlow and Keras', minutes: 18 },
          { title: 'Building Your First Neural Network', minutes: 30 },
          { title: 'Building a Simple Image Classifier', minutes: 35 },
        ],
      },
      {
        title: 'AI in the Real World',
        lessons: [
          { title: 'AI Applications: Vision, NLP, Recommendation', minutes: 16 },
          { title: 'Prompt Engineering Basics for LLMs', minutes: 20 },
          { title: 'Responsible AI and Bias Awareness', minutes: 14, article: true },
          { title: 'What to Learn Next: Your AI Roadmap', free: true, minutes: 12 },
        ],
      },
    ],
  },
  {
    title: 'Cybersecurity Fundamentals: Think Like a Hacker, Defend Like a Pro',
    category: 'cybersecurity',
    level: 'beginner',
    price: 49.99,
    salePrice: 29.99,
    featured: true,
    thumb: 'photo-1550751827-4bd374c3f58b',
    description:
      'Learn how cyber attacks work — then learn how to stop them. This course takes you from zero security knowledge to a solid foundation in network security, cryptography, ethical hacking, and real-world defense techniques. You will think the way attackers think, which is the only way to truly defend systems.',
    outcomes: [
      'Understand the cyber threat landscape and common attack types',
      'Explain how phishing, social engineering, and malware work',
      'Apply strong password hygiene and multi-factor authentication',
      'Understand TCP/IP networking and how attackers exploit it',
      'Grasp the fundamentals of encryption and PKI',
      'Identify common web vulnerabilities (OWASP Top 10)',
      'Use basic ethical hacking concepts and tools',
      'Build a personal and professional security checklist',
    ],
    modules: [
      {
        title: 'The Threat Landscape',
        lessons: [
          { title: 'What Is Cybersecurity and Why It Matters', free: true, minutes: 12 },
          { title: 'Types of Cyber Attacks: An Overview', free: true, minutes: 16 },
          { title: 'Social Engineering and Phishing', minutes: 18 },
          { title: 'Malware: Viruses, Ransomware, Spyware', minutes: 16 },
        ],
      },
      {
        title: 'Identity and Access Security',
        lessons: [
          { title: 'Password Security Done Right', free: true, minutes: 14 },
          { title: 'Multi-Factor Authentication Explained', minutes: 12 },
          { title: 'Identity Theft: How It Happens and How to Prevent It', minutes: 16 },
          { title: 'Zero Trust: Never Trust, Always Verify', minutes: 18, article: true },
        ],
      },
      {
        title: 'Network Security',
        lessons: [
          { title: 'How the Internet Works: TCP/IP Crash Course', minutes: 20 },
          { title: 'Firewalls, VPNs, and Network Segmentation', minutes: 18 },
          { title: 'Wi-Fi Security: Attacks on Wireless Networks', minutes: 16 },
          { title: 'Packet Sniffing with Wireshark', minutes: 25 },
        ],
      },
      {
        title: 'Cryptography Basics',
        lessons: [
          { title: 'Symmetric vs Asymmetric Encryption', minutes: 18 },
          { title: 'How HTTPS and TLS Work', minutes: 20 },
          { title: 'Hashing and Digital Signatures', minutes: 16 },
          { title: 'Public Key Infrastructure (PKI)', minutes: 18, article: true },
        ],
      },
      {
        title: 'Web Application Security',
        lessons: [
          { title: 'The OWASP Top 10 Explained', minutes: 22 },
          { title: 'SQL Injection: Attack and Defense', minutes: 24 },
          { title: 'Cross-Site Scripting (XSS) and CSRF', minutes: 20 },
          { title: 'Authentication Vulnerabilities', minutes: 18 },
        ],
      },
      {
        title: 'Ethical Hacking Introduction',
        lessons: [
          { title: 'What Is Ethical Hacking and Penetration Testing?', free: true, minutes: 14 },
          { title: 'Reconnaissance: Gathering Information Legally', minutes: 20 },
          { title: 'Vulnerability Scanning with Nmap', minutes: 22 },
          { title: 'Writing Your First Security Report', minutes: 16, article: true },
        ],
      },
      {
        title: 'Security Best Practices',
        lessons: [
          { title: 'Your Personal Security Checklist', minutes: 14 },
          { title: 'Securing a Linux Server Basics', minutes: 24 },
          { title: 'Incident Response: What to Do When Breached', minutes: 18 },
          { title: 'Career Paths in Cybersecurity', free: true, minutes: 12, article: true },
        ],
      },
    ],
  },
];

async function seedCourses(): Promise<void> {
  await connectDB();

  const tenant = await Tenant.findOne({ slug: 'demo' }).lean<{ _id: Types.ObjectId } | null>();
  if (!tenant) throw new Error('Demo tenant not found — run `npm run seed:tenant` first.');
  const tenantId = tenant._id;

  let instructor = await User.findOne({ tenantId, email: 'instructor@demo.test' });
  if (!instructor) {
    instructor = await User.create({
      tenantId,
      name: 'Dr. Alex Rivera',
      email: 'instructor@demo.test',
      password: 'Password123',
      role: 'instructor',
      isVerified: true,
      bio: 'Practitioner and educator with 12+ years building and teaching software.',
    });
  }

  // Clean re-seed of this tenant's catalog (dev only).
  const existing = await Course.find({ tenantId }).select('_id').lean<{ _id: Types.ObjectId }[]>();
  const courseIds = existing.map((c) => c._id);
  await Promise.all([
    Lesson.deleteMany({ courseId: { $in: courseIds } }),
    Module.deleteMany({ courseId: { $in: courseIds } }),
    Course.deleteMany({ tenantId }),
  ]);

  for (const def of COURSES) {
    const slug = def.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const course = await Course.create({
      tenantId,
      instructorId: instructor._id,
      title: def.title,
      slug,
      description: def.description,
      thumbnail: THUMBS(def.thumb),
      category: def.category,
      level: def.level,
      tags: [def.category, def.level],
      price: def.price,
      salePrice: def.salePrice,
      currency: 'USD',
      language: 'en',
      requirements: ['A computer and an internet connection', 'Enthusiasm to learn'],
      outcomes: def.outcomes,
      rating: { average: 4 + Math.random(), count: Math.floor(20 + Math.random() * 480) },
      enrolledCount: Math.floor(100 + Math.random() * 5000),
      isPublished: true,
      isFeatured: Boolean(def.featured),
      previewVideo: HLS,
    });

    const moduleIds: Types.ObjectId[] = [];
    let totalLessons = 0;
    let totalDuration = 0;

    for (const [mIndex, modDef] of def.modules.entries()) {
      const moduleDoc = await Module.create({
        tenantId,
        courseId: course._id,
        title: modDef.title,
        order: mIndex,
        isPublished: true,
        lessons: [],
      });
      const lessonIds: Types.ObjectId[] = [];
      for (const [lIndex, lessonDef] of modDef.lessons.entries()) {
        const seconds = lessonDef.minutes * 60;
        const lesson = await Lesson.create({
          tenantId,
          courseId: course._id,
          moduleId: moduleDoc._id,
          title: lessonDef.title,
          type: lessonDef.article ? 'article' : 'video',
          order: lIndex,
          isFree: Boolean(lessonDef.free),
          isPublished: true,
          content: lessonDef.article
            ? { article: `<h2>${lessonDef.title}</h2><p>In this lesson we cover the key ideas in depth, with practical examples you can apply immediately.</p>`, duration: seconds, attachments: [] }
            : { videoUrl: HLS, duration: seconds, attachments: [] },
        });
        lessonIds.push(lesson._id);
        totalLessons += 1;
        totalDuration += seconds;
      }
      moduleDoc.lessons = lessonIds;
      await moduleDoc.save();
      moduleIds.push(moduleDoc._id);
    }

    course.modules = moduleIds;
    course.totalLessons = totalLessons;
    course.totalDuration = totalDuration;
    await course.save();
    logger.info(`Seeded course: ${course.title} (${totalLessons} lessons)`);
  }

  logger.info(`✅ Seeded ${COURSES.length} courses for tenant "demo"`);
  await disconnectDB();
}

seedCourses().catch((err) => {
  logger.error({ err }, 'Failed to seed courses');
  process.exit(1);
});
