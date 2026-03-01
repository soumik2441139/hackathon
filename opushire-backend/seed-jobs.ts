import mongoose from 'mongoose';
import { Job } from './src/models/Job';
import { User } from './src/models/User';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.MONGODB_URI || "";

if (!url) {
    console.error('❌ MONGODB_URI is not defined in the environment variables');
    process.exit(1);
}
import { imageToBase64 } from './src/services/image.service';

const seedJobs = async () => {
    try {
        await mongoose.connect(url);
        console.log('✅ Connected to MongoDB');

        // Check if user exists to attach to the job
        let user = await User.findOne({ email: 'admin@opushire.com' });
        if (!user) {
            user = await User.create({
                name: 'Opushire Admin',
                email: 'admin@opushire.com',
                passwordHash: 'password123', // In real app it should be hashed, but fine for seed
                role: 'admin'
            });
            console.log('✅ Created Admin user');
        }

        const rawJobsData = [
            {
                title: "Senior Frontend Engineer",
                company: "Vercel",
                companyLogo: "https://logo.clearbit.com/vercel.com",
                location: "Bangalore, India",
                city: "Bangalore",
                type: "Full-time",
                mode: "Remote",
                salaryMin: 3500000,
                salaryMax: 5000000,
                salary: "₹35 LPA - ₹50 LPA",
                description: "Vercel is looking for a Senior Frontend Engineer to help build the next generation of Next.js and Vercel's platform. You will work closely with the design and product teams to deliver incredible user experiences.",
                responsibilities: ["Build scalable React components", "Optimize performance across the platform", "Mentor junior engineers"],
                requirements: ["5+ years React experience", "Deep knowledge of Next.js", "Experience with TypeScript"],
                tags: ["React", "Next.js", "TypeScript", "Frontend"],
                openings: 2,
                featured: true,
                posted: "1 day ago",
                postedBy: user._id
            },
            {
                title: "Backend SWE (Go)",
                company: "Stripe",
                companyLogo: "https://logo.clearbit.com/stripe.com",
                location: "Gurgaon, India",
                city: "Gurgaon",
                type: "Full-time",
                mode: "Hybrid",
                salaryMin: 4000000,
                salaryMax: 6000000,
                salary: "₹40 LPA - ₹60 LPA",
                description: "Join Stripe's core payments team to build highly reliable, scalable, and secure systems that move money across the world.",
                responsibilities: ["Design and implement core API services", "Ensure 99.999% uptime for payment systems", "Collaborate with banking partners"],
                requirements: ["Strong experience in Go or equivalent systems language", "Understanding of distributed systems", "Prior experience with financial systems is a plus"],
                tags: ["Go", "Distributed Systems", "Backend", "FinTech"],
                openings: 5,
                featured: true,
                posted: "3 days ago",
                postedBy: user._id
            },
            {
                title: "Product Designer UI/UX",
                company: "Airbnb",
                companyLogo: "https://logo.clearbit.com/airbnb.com",
                location: "Mumbai, India",
                city: "Mumbai",
                type: "Contract",
                mode: "Remote",
                salaryMin: 2000000,
                salaryMax: 3000000,
                salary: "₹20 LPA - ₹30 LPA",
                description: "Airbnb is seeking a talented Product Designer to reimagine the booking experience for our super-hosts and long-term stays.",
                responsibilities: ["Conduct user research", "Create wireframes and high-fidelity prototypes", "Work closely with engineering"],
                requirements: ["Portfolio showcasing complex application design", "Figma expertise", "3+ years of product design experience"],
                tags: ["Figma", "UI/UX", "User Research", "Design"],
                openings: 1,
                featured: false,
                posted: "1 week ago",
                postedBy: user._id
            },
            {
                title: "Machine Learning Intern",
                company: "OpenAI",
                companyLogo: "https://logo.clearbit.com/openai.com",
                location: "Pune, India",
                city: "Pune",
                type: "Internship",
                mode: "Onsite",
                salaryMin: 500000,
                salaryMax: 800000,
                salary: "₹50k - ₹80k per month",
                description: "Spend your summer contributing to state-of-the-art foundation models and generative AI systems with the OpenAI research team.",
                responsibilities: ["Assist in training large language models", "Write optimization scripts in Python", "Analyze dataset quality"],
                requirements: ["Currently pursuing an MS or PhD in Computer Science", "Strong Python and PyTorch skills", "Published research is a strong plus"],
                tags: ["Python", "PyTorch", "AI/ML", "Research"],
                openings: 10,
                featured: true,
                posted: "Just now",
                postedBy: user._id
            },
            {
                title: "Full Stack Developer",
                company: "Cred",
                companyLogo: "https://logo.clearbit.com/cred.club",
                location: "Bangalore, India",
                city: "Bangalore",
                type: "Full-time",
                mode: "Onsite",
                salaryMin: 2500000,
                salaryMax: 4500000,
                salary: "₹25 LPA - ₹45 LPA",
                description: "CRED is looking for exceptional developers to build trust-based financial products. You will work on massive scale systems that serve millions of premium users.",
                responsibilities: ["Architect highly scalable backend microservices", "Develop stunning user interfaces", "Maintain strict security standards"],
                requirements: ["Proficiency in Node.js and React", "Experience with AWS and microservices architecture", "Strong problem-solving skills"],
                tags: ["Node.js", "React", "AWS", "FinTech"],
                openings: 3,
                featured: true,
                posted: "2 hours ago",
                postedBy: user._id
            }
        ];

        console.log('⏳ Converting company logos to Base64...');
        const jobsData = [];
        for (const job of rawJobsData) {
            const base64Logo = await imageToBase64(job.companyLogo);
            jobsData.push({ ...job, companyLogo: base64Logo });
            console.log(`✅ Processed logo for ${job.company}`);
        }

        // Clear existing jobs
        await Job.deleteMany({});
        console.log('🗑️ Cleared existing jobs');

        // Insert new jobs
        await Job.insertMany(jobsData);
        console.log('✅ Successfully seeded new jobs with Base64 logos!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedJobs();
