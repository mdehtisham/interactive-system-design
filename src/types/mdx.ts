export interface TopicFrontmatter {
  title: string
  description: string
  order: number
  cluster: string
  difficulty: 'easy' | 'medium' | 'hard'
  interviewFrequency: 'high' | 'medium' | 'low'
  prerequisites: string[]
}
