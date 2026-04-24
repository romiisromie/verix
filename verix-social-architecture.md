# 🏗️ Verix Social - Техническая архитектура

## 📋 Обзор системы
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
    // Создание нового пользователя
    // Расчет начального репутационного скора
    // Привязка к школе
  }
  
  async updateUserStats(userId, newProject) {
    // Обновление статистики после нового проекта
    // Перерасчет рейтингов
    // Уведомление об изменении позиции
  }
  
  async getUserRankings(userId) {
    // Получение всех рейтингов пользователя
    // Глобальный, школьный, городской
    // По навыкам
  }
}
```

### 2. Rating Service (rating-service.js)
```javascript
class RatingService {
  async calculateUserScore(userId) {
    // Алгоритм расчета репутационного скора:
    // - Верифицированные проекты (40%)
    // - Навыки и их уровень (25%)
    // - Активность в сообществе (20%)
    // - Менторство и помощь другим (15%)
  }
  
  async updateRankings() {
    // Ежедневное обновление всех рейтингов
    // Расчет позиций в разных категориях
    // Сохранение истории изменений
  }
  
  async getLeaderboard(type, filters) {
    // Получение топ-листов
    // Пагинация и фильтрация
    // Кэширование результатов
  }
}
```

### 3. School Service (school-service.js)
```javascript
class SchoolService {
  async calculateSchoolStats(schoolId) {
    // Расчет средней репутации учеников
    // Активность и вовлеченность
    // Достижения и награды
  }
  
  async getSchoolRankings() {
    // Рейтинг школ по городам
    // Рейтинг по направлениям
    // Динамика изменений
  }
  
  async generateSchoolReport(schoolId, period) {
    // Аналитический отчет для школы
    // Статистика по ученикам
    // Рекомендации по улучшению
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
        <h2>🏆 Рейтинг {type === 'global' ? 'учеников' : 'школ'}</h2>
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
        label="Глобальный рейтинг"
        value={`#${user.globalRank}`}
        change={user.globalRankChange}
      />
      <StatCard 
        icon="🎓"
        label="Рейтинг в школе"
        value={`#${user.schoolRank}`}
        change={user.schoolRankChange}
      />
      <StatCard 
        icon="⭐"
        label="Репутация"
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
          🏆 #{school.cityRank} в {school.city}
        </div>
      </div>
      
      <div className="school-stats">
        <StatGrid stats={school.stats} />
        <AchievementList achievements={school.achievements} />
        <TopStudents students={school.topStudents} />
      </div>
      
      <div className="school-competitions">
        <h2>🎯 Соревнования</h2>
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

// Подписка на обновления рейтингов
socket.emit('subscribe', { 
  type: 'rankings', 
  filters: { school: 'school123' } 
});

// Получение обновлений в реальном времени
socket.on('ranking_update', (data) => {
  updateRankingDisplay(data);
  showNotification('🎉 Новый рейтинг доступен!');
});

// Подписка на достижения
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
    name: '🚀 Первый шаг',
    description: 'Загрузил первый проект',
    icon: '🚀',
    points: 10
  },
  'top_10': {
    name: '🏆 Топ-10',
    description: 'Вошел в топ-10 рейтинга',
    icon: '🏆',
    points: 100
  },
  'mentor': {
    name: '🤝 Ментор',
    description: 'Помог 5 ученикам',
    icon: '🤝',
    points: 50
  }
};
```

### Competition Engine
```javascript
class CompetitionEngine {
  async createCompetition(config) {
    // Создание соревнования между школами
    // Настройка правил и призов
    // Уведомление участников
  }
  
  async trackProgress(competitionId) {
    // Отслеживание прогресса в реальном времени
    // Расчет промежуточных результатов
    // Генерация событий
  }
  
  async finalizeCompetition(competitionId) {
    // Подведение итогов
    // Награждение победителей
    // Обновление рейтингов
  }
}
```

## 🔒 Security & Performance

### Security Measures
- JWT аутентификация
- Rate limiting для API
- Валидация данных
- Protection от cheating в рейтингах
- GDPR compliance

### Performance Optimization
- Redis кэширование рейтингов
- CDN для статических ресурсов
- Lazy loading для списков
- Background jobs для расчетов
- Database indexing

## 📈 Monitoring & Analytics

```javascript
// Метрики для отслеживания
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

Эта архитектура обеспечит масштабируемость, производительность и гибкость для развития Verix Social! 🚀
