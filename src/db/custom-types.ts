import { customType } from "drizzle-orm/sqlite-core"

/** Fake JSON type, cannot be queried but gets (de)serialized for us */
export const json = <TData>(name: string) =>
  customType<{ data: TData; driverData: string }>({
    dataType() {
      return "text"
    },
    toDriver(value: TData): string {
      return JSON.stringify(value)
    },
    fromDriver(value: string): TData {
      return JSON.parse(value)
    },
  })(name)