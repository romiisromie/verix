# 🏗️ Verix Social - Technical Architecture

## 📋 System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Client    │    │   Admin Panel   │
│   (React Native)│    │   (React/Vue)   │    │   (Dashboard)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     API Gateway           │
                    │   (Express.js + Auth)     │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────┴─────┐        ┌───────┴───────┐      ┌──────┴──────┐
    │ User Svc  │        │ Rating Svc    │      │ School Svc  │
    │ (Node.js) │        │ (Node.js)     │      │ (Node.js)   │
    └─────┬─────┘        └───────┬───────┘      └──────┬──────┘
          │                      │                     │
          └──────────────────────┼─────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Database Layer        │
                    │  MongoDB + Redis Cache    │
                    └───────────────────────────┘
```

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  schoolId: ObjectId,
  city: String,
  grade: Number, // 9-11
  profile: {
    avatar: String,
    bio: String,
    skills: [{
      name: String,
      level: Number, // 0-100
      verified: Boolean,
      projects: [ObjectId]
    }]
  },
  stats: {
    reputationScore: Number,
    globalRank: Number,
    schoolRank: Number,
    cityRank: Number,
    achievements: [String],
    projectsCount: Number,
    mentorshipHours: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Schools Collection
```javascript
{
  _id: ObjectId,
  name: String,
  city: String,
  type: String, // 'public', 'private', 'specialized'
  stats: {
    totalStudents: Number,
    activeStudents: Number,
    avgReputation: Number,
    cityRank: Number,
    countryRank: Number,
    achievements: [{
      type: String,
      count: Number,
      date: Date
    }]
  },
  achievements: [{
    name: String,
    description: String,
    icon: String,
    unlockedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Projects Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  title: String,
  description: String,
  skills: [String],
  difficulty: Number,
  aiAnalysis: {
    overallScore: Number,
    originality: Number,
    complexity: Number,
    verdict: String,
    feedback: String
  },
  verified: Boolean,
  public: Boolean,
  likes: Number,
  views: Number,
  createdAt: Date
}
```

### Rankings Collection
```javascript
{
  _id: ObjectId,
  type: String, // 'global', 'school', 'city', 'skill'
  period: String, // 'daily', 'weekly', 'monthly'
  data: [{
    userId: ObjectId,
    score: Number,
    rank: Number,
    change: Number // rank change from previous period
  }],
  updatedAt: Date
}
```

## 🔧 Backend Services

### 1. User Service (user-service.js)
```javascript
class UserService {
  async createUser(userData) {
    // Create new user
    // Calculate initial reputation score
    // Link to school
  }
  
  async updateUserStats(userId, newProject) {
    // Update stats after a new project
    // Recalculate rankings
    // Notify of position change
  }
  
  async getUserRankings(userId) {
    // Get all user rankings
    // Global, school, city
    // By skills
  }
}
```

### 2. Rating Service (rating-service.js)
```javascript
class RatingService {
  async calculateUserScore(userId) {
    // Reputation score calculation algorithm:
    // - Verified projects (40%)
    // - Skills and their levels (25%)
    // - Community activity (20%)
    // - Mentorship and helping others (15%)
  }
  
  async updateRankings() {
    // Daily update of all rankings
    // Calculate positions across categories
    // Save change history
  }
  
  async getLeaderboard(type, filters) {
    // Get top lists
    // Pagination and filtering
    // Cache results
  }
}
```

### 3. School Service (school-service.js)
```javascript
class SchoolService {
  async calculateSchoolStats(schoolId) {
    // Calculate average student reputation
    // Activity and engagement
    // Achievements and awards
  }
  
  async getSchoolRankings() {
    // School rankings by city
    // Rankings by specialization
    // Change dynamics
  }
  
  async generateSchoolReport(schoolId, period) {
    // Analytical report for the school
    // Student statistics
    // Improvement recommendations
  }
}
```

## 🎨 Frontend Components

### 1. Leaderboard Component
```jsx
const Leaderboard = ({ type, filters }) => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2>🏆 {type === 'global' ? 'Student' : 'School'} Rankings</h2>
        <FilterPanel filters={filters} />
      </div>
      
      <div className="leaderboard-list">
        {rankings.map((item, index) => (
          <RankingCard 
            key={item.id}
            rank={index + 1}
            user={item}
            change={item.change}
            type={type}
          />
        ))}
      </div>
    </div>
  );
};
```

### 2. Profile Stats Component
```jsx
const ProfileStats = ({ userId }) => {
  return (
    <div className="profile-stats">
      <StatCard 
        icon="🏆"
        label="Global Rank"
        value={`#${user.globalRank}`}
        change={user.globalRankChange}
      />
      <StatCard 
        icon="🎓"
        label="School Rank"
        value={`#${user.schoolRank}`}
        change={user.schoolRankChange}
      />
      <StatCard 
        icon="⭐"
        label="Reputation"
        value={user.reputationScore}
        change={user.reputationChange}
      />
    </div>
  );
};
```

### 3. School Dashboard Component
```jsx
const SchoolDashboard = ({ schoolId }) => {
  return (
    <div className="school-dashboard">
      <div className="school-header">
        <h1>{school.name}</h1>
        <div className="school-rank">
          🏆 #{school.cityRank} in {school.city}
        </div>
      </div>
      
      <div className="school-stats">
        <StatGrid stats={school.stats} />
        <AchievementList achievements={school.achievements} />
        <TopStudents students={school.topStudents} />
      </div>
      
      <div className="school-competitions">
        <h2>🎯 Competitions</h2>
        <CompetitionList competitions={activeCompetitions} />
      </div>
    </div>
  );
};
```

## 📊 Real-time Updates (WebSocket)

```javascript
// WebSocket Events
const socket = io('wss://api.verix.social');

// Subscribe to ranking updates
socket.emit('subscribe', { 
  type: 'rankings', 
  filters: { school: 'school123' } 
});

// Receive real-time updates
socket.on('ranking_update', (data) => {
  updateRankingDisplay(data);
  showNotification('🎉 New ranking is available!');
});

// Subscribe to achievements
socket.emit('subscribe', { type: 'achievements', userId: 'user456' });

socket.on('achievement_unlocked', (achievement) => {
  showAchievementModal(achievement);
  triggerConfetti();
});
```

## 🚀 API Endpoints

### User Rankings
```
GET /api/rankings/users/global
GET /api/rankings/users/school/:schoolId
GET /api/rankings/users/city/:city
GET /api/rankings/users/skill/:skillName
```

### School Rankings
```
GET /api/rankings/schools/city/:city
GET /api/rankings/schools/country
GET /api/rankings/schools/specialized
```

### User Stats
```
GET /api/users/:userId/stats
GET /api/users/:userId/achievements
GET /api/users/:userId/progress
```

### School Analytics
```
GET /api/schools/:schoolId/analytics
GET /api/schools/:schoolId/students
GET /api/schools/:schoolId/competitions
```

## 🎯 Gamification Features

### Achievement System
```javascript
const achievements = {
  'first_project': {
    name: '🚀 First Step',
    description: 'Uploaded first project',
    icon: '🚀',
    points: 10
  },
  'top_10': {
    name: '🏆 Top 10',
    description: 'Entered top 10 rankings',
    icon: '🏆',
    points: 100
  },
  'mentor': {
    name: '🤝 Mentor',
    description: 'Helped 5 students',
    icon: '🤝',
    points: 50
  }
};
```

### Competition Engine
```javascript
class CompetitionEngine {
  async createCompetition(config) {
    // Create competition between schools
    // Set rules and prizes
    // Notify participants
  }
  
  async trackProgress(competitionId) {
    // Track progress in real time
    // Calculate intermediate results
    // Generate events
  }
  
  async finalizeCompetition(competitionId) {
    // Finalize results
    // Award winners
    // Update rankings
  }
}
```

## 🔒 Security & Performance

### Security Measures
- JWT authentication
- API rate limiting
- Data validation
- Cheating protection in rankings
- GDPR compliance

### Performance Optimization
- Redis ranking cache
- CDN for static assets
- Lazy loading for lists
- Background jobs for calculations
- Database indexing

## 📈 Monitoring & Analytics

```javascript
// Tracking metrics
const metrics = {
  userEngagement: {
    dailyActiveUsers: Number,
    sessionDuration: Number,
    rankingViews: Number,
    achievementUnlocks: Number
  },
  systemPerformance: {
    apiResponseTime: Number,
    websocketLatency: Number,
    cacheHitRate: Number,
    errorRate: Number
  },
  businessMetrics: {
    schoolOnboarding: Number,
    premiumSubscriptions: Number,
    competitionParticipation: Number,
    employerEngagement: Number
  }
};
```

## 🚀 Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │      CDN        │
│   (Nginx)       │    │   (CloudFlare)  │
└─────────┬───────┘    └─────────────────┘
          │
    ┌─────┴─────┐
    │  API GW   │
    │ (Express) │
    └─────┬─────┘
          │
    ┌─────┴─────┐
    │ Services  │
    │ (Docker)  │
    └─────┬─────┘
          │
    ┌─────┴─────┐
    │ Database  │
    │ (MongoDB) │
    └───────────┘
```
