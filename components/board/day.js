import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

dayjs.locale({
  name: 'ko',
  relativeTime: {
    future: "%s",
    past: "%s",
    s: "방금",
    m: "1분 전",
    mm: "%d분 전",
    h: "1시간 전",
    hh: "%d시간 전",
    d: "1일 전",
    dd: "%d일 전",
    M: "1달 전",
    MM: "%d달 전",
    y: "1년 전",
    yy: "%d년 전"
  }
});

dayjs.tz.setDefault("Asia/Seoul");

export default dayjs;