import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendConversionEvent } from '@/lib/conversions'
import { buildLeadMessage, buildWaUrl } from '@/lib/whatsapp'
import { countryFromTimezone } from '@/lib/geo'
import type { BookingData, LeadApiRequest } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LeadApiRequest

    // --- visitorId validation ---
    const visitorId = typeof body?.visitorId === 'string' ? body.visitorId.trim() : ''
    if (!visitorId || visitorId.length > 100) {
      return NextResponse.json({ ok: false, error: 'invalid_visitor' }, { status: 400 })
    }

    // --- country from client timezone/language (for admin reporting) ---
    const country = countryFromTimezone(
      typeof body?.tz === 'string' ? body.tz : undefined,
      typeof body?.lang === 'string' ? body.lang : undefined
    )

    // --- action: progress ---
    if (body.action === 'progress') {
      await db.lead.upsert({
        where: { visitorId },
        create: {
          visitorId,
          status: 'IN_PROGRESS',
          quiz: body.quiz ? JSON.stringify(body.quiz) : undefined,
          ...(country ? { country } : {}),
        },
        update: {
          quiz: body.quiz ? JSON.stringify(body.quiz) : undefined,
          ...(country ? { country } : {}),
        },
      })
      return NextResponse.json({ ok: true })
    }

    // --- action: disqualified ---
    if (body.action === 'disqualified') {
      if (!body.quiz) {
        return NextResponse.json({ ok: false, error: 'invalid_quiz' }, { status: 400 })
      }
      const quizJson = JSON.stringify(body.quiz)
      await db.lead.upsert({
        where: { visitorId },
        create: {
          visitorId,
          status: 'DISQUALIFIED',
          quiz: quizJson,
          ...(country ? { country } : {}),
        },
        update: {
          status: 'DISQUALIFIED',
          quiz: quizJson,
          ...(country ? { country } : {}),
        },
      })
      sendConversionEvent('disqualified_lead').catch(() => {})
      return NextResponse.json({ ok: true })
    }

    // --- action: booked ---
    if (body.action === 'booked') {
      const quiz = body.quiz
      const booking = body.booking
      if (!quiz) {
        return NextResponse.json({ ok: false, error: 'invalid_quiz' }, { status: 400 })
      }
      if (!booking) {
        return NextResponse.json({ ok: false, error: 'invalid_booking' }, { status: 400 })
      }

      // name
      const name = typeof booking.name === 'string' ? booking.name.trim() : ''
      if (name.length < 2) {
        return NextResponse.json({ ok: false, error: 'invalid_name' }, { status: 400 })
      }

      // whatsapp — normalize to a 10-digit Colombian mobile number
      const digits = typeof booking.whatsapp === 'string' ? booking.whatsapp.replace(/\D/g, '') : ''
      let localNumber = digits
      if (localNumber.startsWith('57') && localNumber.length === 12) {
        localNumber = localNumber.slice(2)
      }
      if (!/^3\d{9}$/.test(localNumber)) {
        return NextResponse.json({ ok: false, error: 'invalid_whatsapp' }, { status: 400 })
      }
      const whatsapp = `+57 ${localNumber.slice(0, 3)} ${localNumber.slice(3, 6)} ${localNumber.slice(6)}`

      // email (optional)
      const email = typeof booking.email === 'string' ? booking.email.trim() : ''
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
      }

      // business type (booking form)
      const businessType =
        typeof booking.businessType === 'string' ? booking.businessType.trim() : ''
      if (businessType.length < 2 || businessType.length > 60) {
        return NextResponse.json({ ok: false, error: 'invalid_business' }, { status: 400 })
      }

      // session
      const sessionDate =
        typeof booking.sessionDate === 'string' ? booking.sessionDate.trim() : ''
      const sessionTime =
        typeof booking.sessionTime === 'string' ? booking.sessionTime.trim() : ''
      if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) || !sessionTime) {
        return NextResponse.json({ ok: false, error: 'invalid_session' }, { status: 400 })
      }

      const messageBooking: BookingData = {
        name,
        whatsapp,
        email,
        businessType,
        sessionDate,
        sessionTime,
      }
      const waMessage = buildLeadMessage(quiz, messageBooking)
      // The booking form's business selection is the authoritative value —
      // sync it into the stored quiz so the admin panel shows it.
      const quizJson = JSON.stringify({ ...quiz, businessType })

      await db.lead.upsert({
        where: { visitorId },
        create: {
          visitorId,
          status: 'QUALIFIED',
          name,
          whatsapp,
          email: email || null,
          ...(country ? { country } : {}),
          sessionDate,
          sessionTime,
          waMessage,
          quiz: quizJson,
        },
        update: {
          status: 'QUALIFIED',
          name,
          whatsapp,
          email: email || null,
          ...(country ? { country } : {}),
          sessionDate,
          sessionTime,
          waMessage,
          quiz: quizJson,
        },
      })

      sendConversionEvent('Schedule').catch(() => {})
      sendConversionEvent('appointment_booked').catch(() => {})

      return NextResponse.json({ ok: true, waUrl: buildWaUrl(waMessage) })
    }

    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
