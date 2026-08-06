/**
 * A service that *does* extend `Service`.
 *
 * Class keys do not require abandoning `EmberObject`. When the key class already
 * satisfies the container's factory contract (a static `create`), it is
 * registered directly and instantiated exactly the way a string-keyed service is
 * today. The point is that extending `Service` becomes a choice rather than a
 * requirement.
 */
import { tracked } from "@glimmer/tracking";
import Service from "@ember/service";

export default class Logger extends Service {
  @tracked lines: readonly string[] = [];

  log = (line: string) => {
    this.lines = [...this.lines, line];
  };
}
