export type BudgetConfirmed = 'SI_CUENTO' | 'PUEDO_REUNIRLO' | 'NO_POR_AHORA'

export interface QuizData {
  businessType: string
  dailyMessages: string
  trafficSources: string[]
  currentSystem: string
  automationPrev: string
  automationTool?: string
  implementationTiming: string
  decisionMaker: string
  investmentCapacity: string
  budgetConfirmed?: BudgetConfirmed
}

export interface BookingData {
  name: string
  whatsapp: string
  email: string
  businessType: string
  sessionDate: string
  sessionTime: string
}

export interface LeadApiRequest {
  visitorId: string
  action: 'progress' | 'disqualified' | 'booked'
  tz?: string
  lang?: string
  quiz?: QuizData
  booking?: BookingData
}
