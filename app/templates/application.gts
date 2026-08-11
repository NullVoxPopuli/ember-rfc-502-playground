import CounterDemo from "#components/counter-demo.gts";
import CycleDemo from "#components/cycle-demo.gts";
import InteropDemo from "#components/interop-demo.gts";

<template>
  <h1>RFC 502 &mdash; Explicit Dependency Injection</h1>

  <p>
    A runnable prototype of
    <a href="https://github.com/emberjs/rfcs/pull/502">emberjs/rfcs#502</a>. The implementation is
    in
    <code>app/di/</code>; each section below exercises a different claim the RFC makes.
  </p>

  <CounterDemo />
  <CycleDemo />
  <InteropDemo />

  {{outlet}}
</template>
