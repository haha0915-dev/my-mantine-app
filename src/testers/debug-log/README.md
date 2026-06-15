# Debug Log Tester Guide

## 파일 구성

- `debug-log-tester.json`: 디버그 로그 저장 허용 로그인 ID 설정 파일
- `debug-log-tester.example.json`: 샘플 파일

## 기본 규칙

- `loginIds`에는 API 로그와 콘솔 로그 저장을 허용할 로그인 ID만 등록합니다.
- 로그인 ID는 코드에서 `trim + lowercase` 정규화 후 매칭됩니다.
- `local` 환경에서는 개발/검수를 위해 로그인 ID 조건 없이 동작합니다.
- `development` 환경에서는 등록된 로그인 ID 조건이 맞을 때만 동작합니다.
- 저장된 로그는 `createdAt` 기준 TTL이 지나면 정리 대상입니다. API 로그는 48시간, 콘솔 로그는 24시간을 사용합니다.
- 만료 정리는 `local` 또는 `development` 환경에서 모듈 로드 시 1회, 이후 최대 10분에 1회만 실행됩니다.

## 사용 예시

```json
{
  "loginIds": ["tester01", "tester02"]
}
```

## 사용 팁

- 테스트를 끄려면 해당 계정을 삭제하거나 `loginIds`를 빈 배열로 두면 됩니다.
