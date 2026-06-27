export type Cluster = 'web-foundations' | 'storage' | 'scale' | 'reliability'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type InterviewFrequency = 'high' | 'medium' | 'low'
export type LearningPath = 'fundamentals-first' | 'interview-critical' | 'complexity-ladder'
export type HLDWeight = 'primary' | 'supporting'
export type TopicStatus = 'mvp' | 'backlog'

export interface Topic {
  slug: string
  title: string
  cluster: Cluster
  difficulty: Difficulty
  interviewFrequency: InterviewFrequency
  path: LearningPath[]
  hldWeight: HLDWeight
  status: TopicStatus
  prerequisites: string[]
  order: number
}
