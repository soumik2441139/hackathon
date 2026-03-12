# 🧩 Components

Reusable React components organized by feature domain.

## Directory Structure

```
components/
├── ui/              ← Base UI primitives (Button, Badge, Navbar, etc.)
├── animations/      ← Motion & 3D components (ScrollReveal, HeroScene)
├── landing/         ← Landing page sections (Hero, FeaturedJobs, Stats)
├── jobs/            ← Job listing components (JobCard, JobList, ApplyModal)
├── dashboard/       ← Dashboard widgets (ApplicationTracker, SavedJobs)
├── auth/            ← Auth-related components
├── providers/       ← Context providers (SmoothScrollProvider)
└── SecureOverlay.tsx ← Security/privacy overlay
```

## UI Components (`ui/`)

| Component | Purpose |
|-----------|---------|
| `Button.tsx` | 6 variants: primary, secondary, ghost, outline, glass, rose |
| `Badge.tsx` | 5 variants: default, violet, cyan, rose, outline |
| `Navbar.tsx` | Sticky nav with responsive mobile menu |
| `Footer.tsx` | Footer with system status indicators |
| `ProtectedRoute.tsx` | Role-based route guard wrapper |
| `GlowingEffect.tsx` | Magnetic glowing border on hover |
| `ShaderAnimation.tsx` | WebGL shader background |
| `BarVisualizer.tsx` | Bot stats audio-style visualizer |
| `AnimatedLoadingSkeleton.tsx` | Skeleton loading states |

## Animation Components (`animations/`)

| Component | Tech | Purpose |
|-----------|------|---------|
| `ScrollReveal.tsx` | Framer Motion | Scroll-triggered reveals (up/down/left/right) |
| `TextStagger.tsx` | Framer Motion | Word-by-word spring animations |
| `HeroScene.tsx` | Three.js | 3D hero scene |

## Landing Page (`landing/`)

12 section components that compose the main landing page:

`HeroSection` → `FeaturedJobs` → `AgenticHero` → `AgenticIntelligence` → `HowItWorks` → `StatsSection` → `TrustedByMarquee` → `AgenticEvolution` → `AgenticCTA` → `CTASection`

## Job Components (`jobs/`)

| Component | Purpose |
|-----------|---------|
| `JobList.tsx` | Main job listing with state management |
| `JobCard.tsx` | Individual job card with glowing hover effects |
| `JobFilter.tsx` | Type and category filter sidebar |
| `ApplyModal.tsx` | Application modal (cover letter, phone, LinkedIn) |

## Dashboard Components (`dashboard/`)

| Component | Purpose |
|-----------|---------|
| `ApplicationTracker.tsx` | Student's application status list |
| `SavedJobs.tsx` | Grid of bookmarked jobs |
