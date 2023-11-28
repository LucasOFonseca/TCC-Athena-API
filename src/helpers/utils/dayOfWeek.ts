import { DayOfWeek } from '../../models/dtos';

export const allDaysOfWeek = [
  DayOfWeek.monday,
  DayOfWeek.tuesday,
  DayOfWeek.wednesday,
  DayOfWeek.thursday,
  DayOfWeek.friday,
  DayOfWeek.saturday,
  DayOfWeek.sunday,
];

export function translateDayOfWeek(
  dayOfWeek: DayOfWeek,
  abbreviated?: boolean
): string {
  const translations = {
    [DayOfWeek.monday]: abbreviated ? 'seg' : 'segunda-feira',
    [DayOfWeek.tuesday]: abbreviated ? 'ter' : 'terça-feira',
    [DayOfWeek.wednesday]: abbreviated ? 'qua' : 'quarta-feira',
    [DayOfWeek.thursday]: abbreviated ? 'qui' : 'quinta-feira',
    [DayOfWeek.friday]: abbreviated ? 'sex' : 'sexta-feira',
    [DayOfWeek.saturday]: abbreviated ? 'sab' : 'sábado',
    [DayOfWeek.sunday]: abbreviated ? 'dom' : 'domingo',
  };

  return translations[dayOfWeek];
}
