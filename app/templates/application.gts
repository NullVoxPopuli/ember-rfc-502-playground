import CookiesDemo from "#app/demos/cookies/demo.gts";
import CounterDemo from "#app/demos/counter/demo.gts";
import CycleDemo from "#app/demos/cycle/demo.gts";
import InteropDemo from "#app/demos/interop/demo.gts";

<template>
  <h1>RFC 502 &mdash; Explicit Dependency Injection</h1>

  <p>
    A prototype of
    <a href="https://github.com/emberjs/rfcs/pull/502">emberjs/rfcs#502</a>. The mechanism is in
    <code>app/di/</code>; each demo below lives in its own folder under
    <code>app/demos/</code>, together with its services and its test.
  </p>

  <CounterDemo />
  <CycleDemo />
  <CookiesDemo />
  <InteropDemo />

  {{outlet}}
</template>
