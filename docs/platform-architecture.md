# EduLive Platform Architecture
## Interactive Educational Platform (Outschool-style)

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                        │
│                                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐     │
│   │  Web App  │    │ iOS App  │    │ Android  │    │ Teacher Dashboard │     │
│   │ (React)   │    │ (Swift)  │    │ (Kotlin) │    │   (React Admin)  │     │
│   └─────┬─────┘    └─────┬────┘    └─────┬────┘    └────────┬─────────┘     │
│         │                │               │                   │               │
└─────────┼────────────────┼───────────────┼───────────────────┼───────────────┘
          │                │               │                   │
          └────────────────┴───────┬───────┴───────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │      CloudFront CDN          │
                    │   (Static Assets + API)      │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │      API Gateway / ALB        │
                    │  (Rate Limiting, Auth, CORS)  │
                    └──────────────┬──────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   REST / GraphQL │  │   WebSocket      │  │   Media Server       │
│   API Services   │  │   Gateway        │  │   (mediasoup SFU)    │
│                  │  │   (Real-time)    │  │                      │
│  ┌────────────┐  │  │  ┌────────────┐  │  │  ┌────────────────┐  │
│  │ User Svc   │  │  │  │ Chat       │  │  │  │ Video Rooms    │  │
│  │ Class Svc  │  │  │  │ Presence   │  │  │  │ Screen Share   │  │
│  │ Booking Svc│  │  │  │ Notif.     │  │  │  │ Recording      │  │
│  │ Payment Svc│  │  │  │ Collab.    │  │  │  │ Whiteboard     │  │
│  │ Review Svc │  │  │  └────────────┘  │  │  └────────────────┘  │
│  │ Search Svc │  │  │                  │  │                      │
│  └────────────┘  │  └──────────────────┘  └──────────────────────┘
└────────┬─────────┘             │                      │
         │                       │                      │
         └───────────┬───────────┴──────────────────────┘
                     │
    ┌────────────────┼────────────────────────────────┐
    │                │           DATA LAYER            │
    │   ┌────────────▼──────┐  ┌───────────────────┐  │
    │   │  PostgreSQL (RDS) │  │  Redis (ElastiCache│  │
    │   │  - Users          │  │  - Sessions        │  │
    │   │  - Classes        │  │  - Presence        │  │
    │   │  - Bookings       │  │  - Rate Limits     │  │
    │   │  - Payments       │  │  - Cache           │  │
    │   │  - Reviews        │  │  - Pub/Sub         │  │
    │   └───────────────────┘  └───────────────────┘  │
    │                                                   │
    │   ┌───────────────────┐  ┌───────────────────┐  │
    │   │  S3               │  │  Elasticsearch     │  │
    │   │  - Recordings     │  │  - Class Search    │  │
    │   │  - Uploads        │  │  - Teacher Search  │  │
    │   │  - Thumbnails     │  │  - Full-text       │  │
    │   └───────────────────┘  └───────────────────┘  │
    │                                                   │
    │   ┌───────────────────┐  ┌───────────────────┐  │
    │   │  DynamoDB         │  │  SQS / EventBridge │  │
    │   │  - Chat History   │  │  - Async Events    │  │
    │   │  - Notifications  │  │  - Email Queue     │  │
    │   │  - Analytics      │  │  - Payment Events  │  │
    │   └───────────────────┘  └───────────────────┘  │
    └───────────────────────────────────────────────────┘
```

---

## 2. Microservices Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Kong / AWS)                       │
│                   Authentication ─ Rate Limiting ─ Routing            │
└───────────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
            │          │          │          │          │
            ▼          ▼          ▼          ▼          ▼
     ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
     │  USER    ││  CLASS   ││ BOOKING  ││ PAYMENT  ││  MEDIA   │
     │ SERVICE  ││ SERVICE  ││ SERVICE  ││ SERVICE  ││ SERVICE  │
     │          ││          ││          ││          ││          │
     │ - Auth   ││ - CRUD   ││ - Reserve││ - Stripe ││ - Rooms  │
     │ - Profile││ - Schedule││ - Cancel ││ - Payout ││ - WebRTC │
     │ - Roles  ││ - Catalog││ - Wait-  ││ - Refund ││ - Record │
     │ - KYC    ││ - Tags   ││   list   ││ - Invoice││ - Screen │
     │ - Parent ││ - Curric.││ - Attend.││ - Escrow ││ - Chat   │
     │   Guard  ││          ││          ││          ││ - Board  │
     └────┬─────┘└────┬─────┘└────┬─────┘└────┬─────┘└────┬─────┘
          │           │           │           │           │
          ▼           ▼           ▼           ▼           ▼
     ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
     │ REVIEW   ││ SEARCH   ││ NOTIF.   ││ ANALYTICS││ CONTENT  │
     │ SERVICE  ││ SERVICE  ││ SERVICE  ││ SERVICE  ││ SERVICE  │
     │          ││          ││          ││          ││          │
     │ - Rating ││ - Elastic││ - Email  ││ - Events ││ - Files  │
     │ - Report ││ - Filters││ - Push   ││ - Metrics││ - Homework│
     │ - Trust  ││ - Suggest││ - SMS    ││ - Reports││ - Quizzes│
     │ - Moderat││ - Autocmp││ - In-app ││ - Teacher││ - Polls  │
     └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘

                    ┌──────────────────────┐
                    │    EVENT BUS          │
                    │  (EventBridge / SQS)  │
                    │                       │
                    │  Events:              │
                    │  - user.registered    │
                    │  - class.created      │
                    │  - booking.confirmed  │
                    │  - payment.completed  │
                    │  - session.started    │
                    │  - review.submitted   │
                    └──────────────────────┘
```

---

## 3. Database Schema (Core Entities)

```
┌─────────────────────┐       ┌─────────────────────┐
│       users          │       │    teacher_profiles  │
├─────────────────────┤       ├─────────────────────┤
│ id            (PK)  │──┐    │ id            (PK)  │
│ email               │  │    │ user_id       (FK)  │──┐
│ password_hash       │  │    │ bio                  │  │
│ role (teacher/      │  │    │ headline             │  │
│   parent/student/   │  │    │ subjects[]           │  │
│   admin)            │  │    │ certifications[]     │  │
│ first_name          │  │    │ years_experience     │  │
│ last_name           │  │    │ hourly_rate          │  │
│ avatar_url          │  │    │ rating_avg           │  │
│ timezone            │  │    │ total_reviews        │  │
│ email_verified      │  │    │ total_students       │  │
│ created_at          │  │    │ stripe_account_id    │  │
│ updated_at          │  │    │ approved             │  │
└─────────────────────┘  │    │ background_check     │  │
                         │    └─────────────────────┘  │
    ┌────────────────────┘                              │
    │                                                   │
    ▼                                                   │
┌─────────────────────┐       ┌─────────────────────┐  │
│   parent_students   │       │      classes         │  │
├─────────────────────┤       ├─────────────────────┤  │
│ id            (PK)  │       │ id            (PK)  │  │
│ parent_id     (FK)  │       │ teacher_id    (FK)  │◄─┘
│ student_name        │       │ title                │
│ student_age         │       │ description          │
│ grade_level         │       │ subject              │
│ notes               │       │ age_min              │
└─────────────────────┘       │ age_max              │
                              │ class_type           │──── one-time │ multi-day │
                              │ max_students         │     ongoing │ self-paced
                              │ price_cents          │
                              │ duration_minutes     │
                              │ thumbnail_url        │
                              │ status (draft/       │
                              │   published/archived)│
                              │ tags[]               │
                              │ created_at           │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
         ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
         │   sessions      │  │   bookings      │  │    reviews      │
         ├─────────────────┤  ├─────────────────┤  ├─────────────────┤
         │ id        (PK)  │  │ id        (PK)  │  │ id        (PK)  │
         │ class_id  (FK)  │  │ class_id  (FK)  │  │ class_id  (FK)  │
         │ start_time      │  │ user_id   (FK)  │  │ user_id   (FK)  │
         │ end_time        │  │ student_id(FK)  │  │ rating (1-5)    │
         │ room_id         │  │ status          │  │ comment          │
         │ recording_url   │  │  (confirmed/    │  │ teacher_reply    │
         │ whiteboard_data │  │   cancelled/    │  │ helpful_count    │
         │ status          │  │   completed)    │  │ created_at       │
         └─────────────────┘  │ payment_id (FK) │  └─────────────────┘
                              │ created_at      │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │    payments      │
                              ├─────────────────┤
                              │ id        (PK)  │
                              │ booking_id(FK)  │
                              │ amount_cents     │
                              │ platform_fee     │
                              │ teacher_payout   │
                              │ stripe_charge_id │
                              │ status           │
                              │  (pending/paid/  │
                              │   refunded)      │
                              │ paid_out_at      │
                              └─────────────────┘
```

---

## 4. Live Session Architecture (Real-time)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        LIVE SESSION ROOM                              │
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Teacher  │  │ Student1 │  │ Student2 │  │ Student3 │   ...       │
│  │ (Host)   │  │          │  │          │  │          │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │              │              │              │                  │
│       └──────────────┴──────┬───────┴──────────────┘                 │
│                             │                                        │
│              ┌──────────────▼──────────────┐                        │
│              │   mediasoup SFU Server       │                        │
│              │                              │                        │
│              │  ┌────────────────────────┐  │                        │
│              │  │     Video Router       │  │                        │
│              │  │                        │  │                        │
│              │  │  Teacher ──►─┬──► All  │  │                        │
│              │  │              │Students │  │                        │
│              │  │  Student ──►─┤         │  │                        │
│              │  │  (if permitted)        │  │                        │
│              │  │              │         │  │                        │
│              │  │  Screen  ──►─┘         │  │                        │
│              │  │  Share                 │  │                        │
│              │  └────────────────────────┘  │                        │
│              │                              │                        │
│              │  ┌────────────────────────┐  │                        │
│              │  │   Audio Router         │  │                        │
│              │  │                        │  │                        │
│              │  │  Teacher ──►── All     │  │                        │
│              │  │  Student ──►── All     │  │                        │
│              │  │  (Hand raise / mute)   │  │                        │
│              │  └────────────────────────┘  │                        │
│              └──────────────────────────────┘                        │
│                             │                                        │
│              ┌──────────────▼──────────────┐                        │
│              │   Interactive Features       │                        │
│              │                              │                        │
│              │  ┌──────┐ ┌──────┐ ┌──────┐ │                        │
│              │  │ Chat │ │White-│ │Polls/│ │                        │
│              │  │      │ │board │ │Quiz  │ │                        │
│              │  └──────┘ └──────┘ └──────┘ │                        │
│              │  ┌──────┐ ┌──────┐ ┌──────┐ │                        │
│              │  │Screen│ │Break-│ │Hand  │ │                        │
│              │  │Share │ │out   │ │Raise │ │                        │
│              │  │      │ │Rooms │ │      │ │                        │
│              │  └──────┘ └──────┘ └──────┘ │                        │
│              │  ┌──────┐ ┌──────┐ ┌──────┐ │                        │
│              │  │File  │ │Emoji │ │Timer │ │                        │
│              │  │Share │ │React │ │      │ │                        │
│              │  └──────┘ └──────┘ └──────┘ │                        │
│              └──────────────────────────────┘                        │
│                                                                       │
│              ┌──────────────────────────────┐                        │
│              │   Recording Pipeline          │                        │
│              │                               │                        │
│              │  mediasoup ──► FFmpeg ──► S3  │                        │
│              │              (transcode) (HLS)│                        │
│              │                    │          │                        │
│              │              CloudFront (VOD) │                        │
│              └──────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. User Flows

### 5a. Class Discovery & Booking Flow

```
  Parent/Student                    Platform                     Teacher
       │                               │                           │
       │  1. Browse/Search classes      │                           │
       │──────────────────────────────►│                           │
       │                               │                           │
       │  2. Filter by:                │                           │
       │     - Subject                 │                           │
       │     - Age group               │                           │
       │     - Schedule                │                           │
       │     - Price                   │                           │
       │     - Rating                  │                           │
       │──────────────────────────────►│                           │
       │                               │                           │
       │  3. View class details        │                           │
       │     + teacher profile         │                           │
       │     + reviews                 │                           │
       │◄──────────────────────────────│                           │
       │                               │                           │
       │  4. Book class                │                           │
       │──────────────────────────────►│                           │
       │                               │  5. Check availability    │
       │                               │─────────────────────────►│
       │                               │                           │
       │                               │  6. Hold payment          │
       │                               │──► Stripe (escrow)        │
       │                               │                           │
       │  7. Booking confirmed         │  8. New booking notif.    │
       │◄──────────────────────────────│─────────────────────────►│
       │                               │                           │
       │  9. Calendar invite (email)   │  10. Calendar update      │
       │◄──────────────────────────────│─────────────────────────►│
       │                               │                           │
  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  CLASS DAY  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
       │                               │                           │
       │  11. Reminder (1hr before)    │  12. Reminder             │
       │◄──────────────────────────────│─────────────────────────►│
       │                               │                           │
       │  13. Join session             │  14. Start session        │
       │──────────────────────────────►│◄─────────────────────────│
       │                               │                           │
       │         ┌─────────────────────┤                           │
       │         │  LIVE SESSION       │                           │
       │         │  - Video/Audio      │                           │
       │         │  - Whiteboard       │                           │
       │         │  - Chat             │                           │
       │         │  - Screen share     │                           │
       │         │  - Polls/Quizzes    │                           │
       │         └─────────────────────┤                           │
       │                               │                           │
       │  15. Session ends             │  16. Session recorded     │
       │◄──────────────────────────────│─────────────────────────►│
       │                               │                           │
       │  17. Leave review             │  18. Payment released     │
       │──────────────────────────────►│─────────────────────────►│
       │                               │    (escrow ──► teacher)   │
```

### 5b. Teacher Onboarding Flow

```
  Teacher                          Platform                    Admin
     │                                │                          │
     │  1. Sign up as teacher         │                          │
     │───────────────────────────────►│                          │
     │                                │                          │
     │  2. Complete profile:          │                          │
     │     - Bio, photo, headline     │                          │
     │     - Subjects & expertise     │                          │
     │     - Teaching experience      │                          │
     │     - Certifications           │                          │
     │───────────────────────────────►│                          │
     │                                │                          │
     │  3. Background check           │                          │
     │     (identity verification)    │                          │
     │───────────────────────────────►│                          │
     │                                │  4. Review application   │
     │                                │─────────────────────────►│
     │                                │                          │
     │                                │  5. Approve / Reject     │
     │  6. Approval notification      │◄─────────────────────────│
     │◄───────────────────────────────│                          │
     │                                │                          │
     │  7. Connect Stripe account     │                          │
     │     (for payouts)              │                          │
     │───────────────────────────────►│                          │
     │                                │                          │
     │  8. Create first class         │                          │
     │     - Title, description       │                          │
     │     - Age range, subject       │                          │
     │     - Schedule, pricing        │                          │
     │     - Curriculum outline       │                          │
     │───────────────────────────────►│                          │
     │                                │                          │
     │  9. Class published!           │                          │
     │◄───────────────────────────────│                          │
```

---

## 6. AWS Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS Cloud (us-east-1)                         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Route 53                                │    │
│  │               edulive.com ──► CloudFront                    │    │
│  └────────────────────────┬────────────────────────────────────┘    │
│                           │                                          │
│  ┌────────────────────────▼────────────────────────────────────┐    │
│  │                    CloudFront CDN                             │    │
│  │                                                              │    │
│  │   /*.html, /static/* ──► S3 (Frontend)                      │    │
│  │   /api/*             ──► ALB (Backend)                       │    │
│  │   /ws/*              ──► ALB (WebSocket)                     │    │
│  │   /media/*           ──► ALB (Media Server)                  │    │
│  └───────┬──────────────────────────┬──────────────────────────┘    │
│          │                          │                                │
│          ▼                          ▼                                │
│  ┌───────────────┐    ┌─────────────────────────────────────┐       │
│  │  S3 Bucket    │    │     Application Load Balancer        │       │
│  │  (Frontend)   │    │                                      │       │
│  │               │    │   /api/*  ──► Backend TG (8080)      │       │
│  │  React SPA    │    │   /ws/*   ──► Backend TG (8080)      │       │
│  │  + config.json│    │   /health ──► Backend TG (8080)      │       │
│  └───────────────┘    └──────────────────┬──────────────────┘       │
│                                          │                           │
│  ┌───────────────────────────────────────▼───────────────────────┐  │
│  │                        VPC                                     │  │
│  │                                                                │  │
│  │  ┌─────────────── Public Subnets ─────────────────────────┐   │  │
│  │  │   NAT Gateway          ALB          Bastion Host       │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  │                                                                │  │
│  │  ┌─────────────── Private Subnets ────────────────────────┐   │  │
│  │  │                                                         │   │  │
│  │  │  ┌─── ECS Cluster (Fargate) ────────────────────────┐  │   │  │
│  │  │  │                                                   │  │   │  │
│  │  │  │  ┌─────────── Task 1 ──────────────────────┐     │  │   │  │
│  │  │  │  │  ┌──────────────┐  ┌──────────────────┐ │     │  │   │  │
│  │  │  │  │  │   Backend    │  │  Media Server     │ │     │  │   │  │
│  │  │  │  │  │  (Spring     │  │  (mediasoup)      │ │     │  │   │  │
│  │  │  │  │  │   Boot)      │  │                   │ │     │  │   │  │
│  │  │  │  │  │  Port 8080   │  │  Port 3000        │ │     │  │   │  │
│  │  │  │  │  └──────────────┘  │  UDP 10000-10100  │ │     │  │   │  │
│  │  │  │  │                    └──────────────────┘ │     │  │   │  │
│  │  │  │  └─────────────────────────────────────────┘     │  │   │  │
│  │  │  │                                                   │  │   │  │
│  │  │  │  ┌─────────── Task 2 (auto-scaled) ────────┐     │  │   │  │
│  │  │  │  │  ┌──────────────┐  ┌──────────────────┐ │     │  │   │  │
│  │  │  │  │  │   Backend    │  │  Media Server     │ │     │  │   │  │
│  │  │  │  │  │  (replica)   │  │  (replica)        │ │     │  │   │  │
│  │  │  │  │  └──────────────┘  └──────────────────┘ │     │  │   │  │
│  │  │  │  └─────────────────────────────────────────┘     │  │   │  │
│  │  │  └───────────────────────────────────────────────────┘  │   │  │
│  │  │                                                         │   │  │
│  │  │  ┌─── Lambda Functions ─────────────────────────────┐  │   │  │
│  │  │  │  - IVS Event Handler                              │  │   │  │
│  │  │  │  - Signed URL Generator                           │  │   │  │
│  │  │  │  - Email Sender (SES)                             │  │   │  │
│  │  │  │  - Image Processor (thumbnails)                   │  │   │  │
│  │  │  └───────────────────────────────────────────────────┘  │   │  │
│  │  └─────────────────────────────────────────────────────────┘   │  │
│  │                                                                │  │
│  │  ┌─────────────── Isolated Subnets ───────────────────────┐   │  │
│  │  │                                                         │   │  │
│  │  │  ┌──────────────┐  ┌──────────────┐                    │   │  │
│  │  │  │  RDS          │  │  ElastiCache  │                    │   │  │
│  │  │  │  PostgreSQL   │  │  Redis        │                    │   │  │
│  │  │  │  (Multi-AZ)   │  │  (Cluster)    │                    │   │  │
│  │  │  └──────────────┘  └──────────────┘                    │   │  │
│  │  └─────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─── Managed Services ─────────────────────────────────────────┐   │
│  │                                                               │   │
│  │  Cognito         SES            SQS          EventBridge     │   │
│  │  (Auth)          (Email)        (Queues)     (Events)        │   │
│  │                                                               │   │
│  │  S3              DynamoDB       CloudWatch   Secrets Mgr     │   │
│  │  (Storage)       (NoSQL)        (Monitoring) (Credentials)   │   │
│  │                                                               │   │
│  │  OpenSearch      SNS            WAF          GuardDuty       │   │
│  │  (Search)        (Push Notif)   (Firewall)   (Security)      │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Payment Flow (Stripe Connect)

```
┌──────────┐          ┌──────────┐          ┌──────────┐
│  Parent   │          │ Platform │          │  Stripe  │
│          │          │          │          │ Connect  │
└─────┬────┘          └─────┬────┘          └─────┬────┘
      │                     │                     │
      │  1. Book class      │                     │
      │  ($30)              │                     │
      │────────────────────►│                     │
      │                     │                     │
      │                     │  2. Create Payment  │
      │                     │     Intent ($30)    │
      │                     │────────────────────►│
      │                     │                     │
      │  3. Confirm card    │                     │
      │────────────────────►│────────────────────►│
      │                     │                     │
      │                     │  4. Payment held    │
      │                     │     in escrow       │
      │                     │◄────────────────────│
      │  5. Booking         │                     │
      │     confirmed       │                     │
      │◄────────────────────│                     │
      │                     │                     │
      │                     │                     │
 ── ── ── ── AFTER CLASS COMPLETED ── ── ── ── ──
      │                     │                     │
      │                     │  6. Release payment │
      │                     │     Platform: $4.50 │
      │                     │     (15% fee)       │
      │                     │     Teacher: $25.50 │
      │                     │────────────────────►│
      │                     │                     │
      │                     │                     │  7. Transfer
      │                     │                     │     $25.50 to
      │                     │                     │     teacher's
      │                     │                     │     Stripe acct
      │                     │                     │
 ── ── ── ── IF CANCELLED (>24h before) ── ── ──
      │                     │                     │
      │                     │  8. Full refund     │
      │  9. Refund          │────────────────────►│
      │     processed       │                     │
      │◄────────────────────│                     │
```

---

## 8. Safety & Trust Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    SAFETY & TRUST LAYER                        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Teacher Verification                       │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │  │
│  │  │ Identity │  │Background│  │ Teaching Credential   │ │  │
│  │  │ Verify   │  │ Check    │  │ Verification          │ │  │
│  │  │ (Stripe  │  │ (Checkr) │  │ (Manual Review)       │ │  │
│  │  │ Identity)│  │          │  │                       │ │  │
│  │  └──────────┘  └──────────┘  └──────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Session Safety                             │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ All sessions │  │ Parent can   │  │ AI Content   │ │  │
│  │  │ recorded     │  │ observe      │  │ Moderation   │ │  │
│  │  │ (consent     │  │ (silent      │  │ (chat filter,│ │  │
│  │  │  required)   │  │  join mode)  │  │  image scan) │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ No private   │  │ Report &     │  │ Age-          │ │  │
│  │  │ messaging    │  │ flag system  │  │ appropriate   │ │  │
│  │  │ (class chat  │  │ (auto-       │  │ content       │ │  │
│  │  │  only)       │  │  escalation) │  │ gates         │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Data Privacy (COPPA Compliance)            │  │
│  │                                                        │  │
│  │  - Parental consent for minors under 13                │  │
│  │  - Minimal data collection from students               │  │
│  │  - No behavioral advertising to children               │  │
│  │  - Parent dashboard for data access/deletion           │  │
│  │  - Encrypted PII at rest and in transit                │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Tech Stack Summary

```
┌──────────────────────────────────────────────────────────────┐
│                        TECH STACK                             │
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│  Frontend    │  React + TypeScript                           │
│              │  Next.js (SSR for SEO on class pages)         │
│              │  TailwindCSS                                  │
│              │  mediasoup-client (WebRTC)                    │
│              │  Zustand (state management)                   │
│              │  React Query (server state)                   │
│              │  Stripe.js (payments)                         │
│              │  tldraw (whiteboard)                          │
│              │                                               │
├──────────────┼───────────────────────────────────────────────┤
│              │                                               │
│  Backend     │  Spring Boot 3 (Java 17) - REST API          │
│              │  Spring Security + Cognito (auth)             │
│              │  Spring Data JPA (database)                   │
│              │  Spring WebSocket (signaling)                 │
│              │  Flyway (migrations)                          │
│              │  MapStruct (DTO mapping)                      │
│              │                                               │
├──────────────┼───────────────────────────────────────────────┤
│              │                                               │
│  Media       │  Node.js + TypeScript                         │
│  Server      │  mediasoup (SFU - WebRTC)                    │
│              │  FFmpeg (recording/transcoding)               │
│              │  Express (signaling HTTP)                     │
│              │                                               │
├──────────────┼───────────────────────────────────────────────┤
│              │                                               │
│  Data        │  PostgreSQL 15 (primary database)             │
│              │  Redis 7 (cache, sessions, pub/sub)           │
│              │  DynamoDB (chat, notifications, analytics)    │
│              │  OpenSearch (class/teacher search)            │
│              │  S3 (files, recordings, static assets)        │
│              │                                               │
├──────────────┼───────────────────────────────────────────────┤
│              │                                               │
│  Infra       │  AWS CDK (IaC)                                │
│              │  ECS Fargate (containers)                     │
│              │  CloudFront (CDN)                             │
│              │  ALB (load balancing)                         │
│              │  Cognito (auth)                               │
│              │  SES (email)                                  │
│              │  EventBridge + SQS (async events)             │
│              │  CloudWatch (monitoring)                      │
│              │  WAF (web firewall)                           │
│              │                                               │
├──────────────┼───────────────────────────────────────────────┤
│              │                                               │
│  3rd Party   │  Stripe Connect (payments + payouts)          │
│              │  Checkr (background checks)                   │
│              │  SendGrid (transactional email)               │
│              │  Sentry (error tracking)                      │
│              │  Segment (analytics)                          │
│              │  Twilio (SMS notifications)                   │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

---

## 10. Scaling Strategy

```
                        Traffic Growth
                 ────────────────────────────►

  Phase 1                Phase 2                 Phase 3
  (0-1K users)           (1K-50K users)          (50K+ users)
  ┌────────────┐         ┌────────────┐          ┌────────────┐
  │ Monolith   │         │ Service    │          │ Full Micro-│
  │            │         │ Split      │          │ services   │
  │ Single ECS │         │            │          │            │
  │ task with  │         │ Separate   │          │ Independent│
  │ backend +  │         │ media      │          │ scaling per│
  │ media      │         │ server to  │          │ service    │
  │ sidecar    │         │ dedicated  │          │            │
  │            │         │ EC2 (GPU)  │          │ Kubernetes │
  │ Single RDS │         │            │          │ (EKS)      │
  │            │         │ Read       │          │            │
  │ Single     │         │ replicas   │          │ Global     │
  │ Redis      │         │ for DB     │          │ deployment │
  │            │         │            │          │ (multi-    │
  │            │         │ ElastiCache│          │  region)   │
  │            │         │ cluster    │          │            │
  │            │         │            │          │ Dedicated  │
  │            │         │ CDN for    │          │ media      │
  │            │         │ recordings │          │ clusters   │
  └────────────┘         └────────────┘          └────────────┘

  Cost: ~$200/mo          Cost: ~$2K/mo           Cost: ~$20K/mo
```
