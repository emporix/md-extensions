import { DeliveryDay, DeliveryTime, Slot, Zone } from '../../models/Shipping'
import { v4 as uuidv4 } from 'uuid'

export interface DeliveryTimeForm {
  isDeliveryDay: boolean
  name: string
  isWeekday: boolean
  weekdays: string[]
  isSingleDate: boolean
  singleDates: {
    value: string
    id: string
  }[]
  dateFrom: string
  dateTo: string
  deliveryDayShift: number
  zones: Zone[]
  slots: Slot[]
  isForAllZones: boolean
  timeZoneId: string
}

export const createForm = () => {
  return {
    isDeliveryDay: true,
    name: '',
    isWeekday: true,
    weekdays: [],
    isSingleDate: true,
    singleDates: [
      {
        id: uuidv4(),
        value: '',
      },
    ],
    dateFrom: '',
    dateTo: '',
    deliveryDayShift: 0,
    zones: [],
    slots: [createFormSlot()],
    isForAllZones: false,
    timeZoneId: getBrowserTimeZoneId(),
  }
}

export const createFormSlot = () => {
  return {
    shippingMethod: '',
    deliveryTimeRange: { timeFrom: '', timeTo: '' },
    cutOffTime: {
      time: '',
      deliveryCycleName: '',
      cutOffDayShift: 0,
    },
    capacity: 1,
    id: uuidv4(),
  }
}

export const mapDeliveryTimeToForm = (time: DeliveryTime, zones: Zone[]) => {
  return {
    isDeliveryDay: time.isDeliveryDay,
    name: time.name || '',
    isWeekday: Object.hasOwn(time.day, 'weekday'),
    weekdays: time.day.weekday ? [time.day.weekday] : [],
    isSingleDate: Object.hasOwn(time.day, 'singleDate'),
    singleDates: time.day.singleDate
      ? [
          {
            id: uuidv4(),
            value: time.day.singleDate,
          },
        ]
      : [],
    dateFrom: time.day.datePeriod?.dateFrom || '',
    dateTo: time.day.datePeriod?.dateTo || '',
    deliveryDayShift: time.deliveryDayShift || 0,
    zones: zones,
    slots: time.slots.map((slot) => ({
      shippingMethod: slot.shippingMethod,
      deliveryTimeRange: {
        timeFrom: slot.deliveryTimeRange.timeFrom,
        timeTo: slot.deliveryTimeRange.timeTo,
      },
      cutOffTime: {
        time: parseDateToStringTime(slot.cutOffTime.time),
        deliveryCycleName: slot.cutOffTime.deliveryCycleName,
        cutOffDayShift: slot.cutOffTime.cutOffDayShift || 0,
      },
      capacity: slot.capacity,
      id: slot.id,
    })),
    isForAllZones: time.isForAllZones,
    timeZoneId: time.timeZoneId,
  }
}

export const mapFormToPayload = (
  formData: DeliveryTimeForm,
  siteCode: string,
  day: Partial<DeliveryDay>,
  zoneId?: string,
  version?: number
) => {
  return {
    name: formData.name,
    siteCode: siteCode,
    isDeliveryDay: formData.isDeliveryDay,
    day: day,
    isForAllZones: formData.isForAllZones,
    timeZoneId: formData.timeZoneId,
    deliveryDayShift: formData.deliveryDayShift,
    ...(version && {
      metadata: { version },
    }),
    ...(!formData.isForAllZones && {
      zoneId: zoneId,
    }),
    ...(formData.isDeliveryDay && {
      slots: formData.slots.map((s) => ({
        ...s,
        cutOffTime: {
          deliveryCycleName: s.cutOffTime.deliveryCycleName,
          time: parseStringTimeToDate(s.cutOffTime.time),
          cutOffDayShift: s.cutOffTime.cutOffDayShift,
        },
      })),
    }),
  }
}

export const getPayloadDays = (data: DeliveryTimeForm) => {
  let days: Partial<DeliveryDay>[] = []
  if (data.isWeekday) {
    days = data.weekdays.map((weekday) => {
      return { weekday }
    })
  } else if (data.isSingleDate) {
    days = data.singleDates.map((date) => {
      return { singleDate: date.value }
    })
  } else {
    days = [
      {
        datePeriod: {
          dateFrom: data.dateFrom,
          dateTo: data.dateTo,
        },
      },
    ]
  }
  return days
}

export const isHourValid = (time: string) => {
  const cleanedTime = time.replace(/_/g, '0')
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/
  return timeRegex.test(cleanedTime)
}

export const parseDateToIsoNoon = (date: Date) => {
  date.setHours(12, 0, 0, 0)
  return date.toISOString()
}

export const parseDateToStringTime = (isoDate: string) => {
  const date = new Date(isoDate)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export const parseStringTimeToDate = (time: string) => {
  const date = new Date()
  const hours = Number(time.slice(0, 2))
  const minutes = Number(time.slice(3, 5))
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

export const getBrowserTimeZoneId = () => {
  if (!Intl || typeof Intl.DateTimeFormat !== 'function') return
  const dateTimeFormat = new Intl.DateTimeFormat()
  return dateTimeFormat.resolvedOptions().timeZone
}
