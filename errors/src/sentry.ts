import * as SentryRn from "@sentry/react-native";

SentryRn.init({
  dsn: "https://92e5033d25dc2c4f9b4d5c667a196128@o4506587726807040.ingest.sentry.io/4506587728314368", // TODO: Protect it
});

export const Sentry = SentryRn
