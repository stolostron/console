// /* Copyright Contributors to the Open Cluster Management project */
import { fromNow, getDuration, isValid, timeFormatter, dateFormatter, twentyFourHourTime } from './datetime'
import { getLastLanguage } from './getLastLanguage';

// Mocking i18n for translation functions
jest.mock('i18next', () => ({
  t: (key: string, options?: any) => {
    if (key === 'Just now') return 'Just now'
    return `${options.count} ${key}`
  },
}))

describe('fromNow', () => {
  it('should return "Just now" for very recent dates (1 ms)', () => {
    const now = new Date()
    const recentDate = new Date(now.getTime() - 1)
    expect(fromNow(recentDate, now)).toBe('Just now')
  })

  it('should return correct relative time for past dates', () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 86400000)
    expect(fromNow(oneDayAgo, now)).toBe('1 day ago')
  })

  it('should return "-" for future dates', () => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + 86400000)
    expect(fromNow(futureDate, now)).toBe('-')
  })

  it.skip('should handle options like omitSuffix', () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 86400000)
    expect(fromNow(oneDayAgo, now, { omitSuffix: true })).toBe('1 day')
  })
})
describe('getDuration', () => {
  it('should correctly calculate duration in days, hours, minutes, and seconds', () => {
    const ms = 90061000
    const result = getDuration(ms)
    expect(result).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 })
  })

  it('should return zero for negative or null values', () => {
    expect(getDuration(-1000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    expect(getDuration(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('isValid', () => {
  it('should return true for valid Date objects', () => {
    const validDate = new Date()
    expect(isValid(validDate)).toBe(true)
  })

  it('should return false for invalid Date objects', () => {
    const invalidDate = new Date('invalid date')
    expect(isValid(invalidDate)).toBe(false)
  })
})

describe.only('Formatters', () => {
  it('should format time correctly using timeFormatter', () => {
    const date = new Date('2024-09-09T12:44:00')
    expect(timeFormatter.format(date)).toBe('12:44 PM')
  })

  it('should format date correctly using dateFormatter', () => {
  const date = new Date(Date.UTC(2024, 8, 8)); // September 8, 2024 (UTC)
  expect(dateFormatter.format(date)).toBe('Sep 8, 2024');
});
})


describe('twentyFourHourTime', () => {
  it('should return time in HH:mm format when showSeconds is false or undefined', () => {
    const date = new Date('2024-09-12T14:30:00') // 14:30
    expect(twentyFourHourTime(date)).toBe('14:30')
  })

  it('should return time in HH:mm:ss format when showSeconds is true', () => {
    const date = new Date('2024-09-12T14:30:45') // 14:30:45
    expect(twentyFourHourTime(date, true)).toBe('14:30:45')
  })

  it('should return time in HH:mm format when showSeconds is false', () => {
    const date = new Date('2024-09-12T14:30:45') // 14:30:45
    expect(twentyFourHourTime(date, false)).toBe('14:30')
  })

  it('should correctly handle midnight (00:00)', () => {
    const date = new Date('2024-09-12T00:00:00') // 00:00
    expect(twentyFourHourTime(date)).toBe('00:00')
  })

  it('should correctly handle single digit hours and minutes', () => {
    const date = new Date('2024-09-12T07:08:00') // 07:08
    expect(twentyFourHourTime(date)).toBe('07:08')
  })

  it('should correctly handle seconds when showSeconds is true', () => {
    const date = new Date('2024-09-12T07:08:09') // 07:08:09
    expect(twentyFourHourTime(date, true)).toBe('07:08:09')
  })

  it('should correctly handle noon (12:00) without seconds', () => {
    const date = new Date('2024-09-12T12:00:00') // 12:00
    expect(twentyFourHourTime(date)).toBe('12:00')
  })

  it('should correctly handle noon (12:00) with seconds', () => {
    const date = new Date('2024-09-12T12:00:00') // 12:00:00
    expect(twentyFourHourTime(date, true)).toBe('12:00:00')
  })
})


jest.mock('./getLastLanguage');

describe('language selection logic', () => {
  let i18n: { language?: string };

  beforeEach(() => {
    // Reset the i18n mock before each test
    i18n = {};
    jest.resetAllMocks();
  });

  it('should return i18n.language when it is defined', () => {
    i18n.language = 'fr';
    const language = (i18n.language || getLastLanguage() || 'en').split('-')[0];
    expect(language).toBe('fr');
  });

  it('should return getLastLanguage when i18n.language is undefined', () => {
    (getLastLanguage as jest.Mock).mockReturnValue('es');

    const language = (i18n.language || getLastLanguage() || 'en').split('-')[0];
    expect(language).toBe('es');
  });

  it('should return "en" when both i18n.language and getLastLanguage return undefined', () => {
    (getLastLanguage as jest.Mock).mockReturnValue(undefined);

    const language = (i18n.language || getLastLanguage() || 'en').split('-')[0];
    expect(language).toBe('en');
  });
});


// describe.only('language selection logic', () => {
//   let i18n: { language?: string };

//   beforeEach(() => {
//     // Reset the i18n mock before each test
//     i18n = {};
//   });

//   it('should return i18n.language when it is defined', () => {
//     i18n.language = 'fr';
//     const language = i18n.language || getLastLanguage() || 'en';
//     expect(language).toBe('fr');
//   });

//   it('should return getLastLanguage when i18n.language is undefined', () => {
//     jest.mock('./getLastLanguage', () => ({
//       getLastLanguage: jest.fn(() => 'es'), // Mocking the return value
//     }));

//     const language = i18n.language || getLastLanguage() || 'en';
//     expect(language).toBe('es');
//   });

//   it('should return "en" when both i18n.language and getLastLanguage return undefined', () => {
//     jest.mock('./getLastLanguage', () => ({
//       getLastLanguage: jest.fn(() => undefined), // Mocking the return value as undefined
//     }));

//     const language = i18n.language || getLastLanguage() || 'en';
//     expect(language).toBe('en');
//   });
// });

