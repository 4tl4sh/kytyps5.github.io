// Adapted from Julien Thibeaut's Motion Primitives, MIT.
// Catalog and original source links: /COMPONENTS.md.
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import * as Accordion from "@radix-ui/react-accordion";
import * as RadixTabs from "@radix-ui/react-tabs";
import { Check, ChevronLeft, ChevronRight, Copy, Plus } from "lucide-react";

export const ease = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  children,
  className = "",
  delay = 0,
  from = "bottom",
  as = "div",
  id,
  distance = 30,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right" | "center";
  as?: "div" | "section" | "article" | "aside" | "footer";
  id?: string;
  distance?: number;
}) {
  const reduced = useReducedMotion();
  const Component = motion[as];
  const x = reduced
    ? 0
    : from === "left"
      ? -distance
      : from === "right"
        ? distance
        : 0;
  const y = reduced || from !== "bottom" ? 0 : distance;
  return (
    <Component
      id={id}
      data-reveal={from}
      className={className}
      initial={{ x, y, scale: !reduced && from === "center" ? 0.97 : 1 }}
      whileInView={{ x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: reduced ? 0 : 0.55,
        ease,
        delay: reduced ? 0 : Math.min(delay, 0.2),
      }}
    >
      {children}
    </Component>
  );
}

export function TextEffect({ children }: { children: string }) {
  const reduced = useReducedMotion();
  return (
    <span className="text-effect" aria-label={children}>
      {children.split(" ").map((word, i) => (
        <span className="word-clip" key={i} aria-hidden="true">
          <motion.span
            initial={{ y: reduced ? 0 : "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.85, ease, delay: 0.12 + i * 0.1 }}
          >
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Magnetic({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const x = useSpring(0, { stiffness: 180, damping: 18 });
  const y = useSpring(0, { stiffness: 180, damping: 18 });
  return (
    <motion.div
      className="magnetic"
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduced || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.12);
        y.set((e.clientY - r.top - r.height / 2) * 0.15);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function Tilt({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0),
    y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 160, damping: 22 }),
    sy = useSpring(y, { stiffness: 160, damping: 22 });
  const rx = useTransform(sy, [-0.5, 0.5], [5, -5]),
    ry = useTransform(sx, [-0.5, 0.5], [-7, 7]);
  const transform = useMotionTemplate`perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  return (
    <motion.div
      className={className}
      style={{ transform }}
      onPointerMove={(e) => {
        if (reduced || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width - 0.5);
        y.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null),
    inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (n) =>
    Math.round(n).toLocaleString("en-US"),
  );
  useEffect(() => {
    if (reduced) {
      spring.jump(value);
      return;
    }
    if (inView && !reduced) {
      spring.jump(Math.max(0, value - 18));
      spring.set(value);
    }
  }, [inView, value, spring, reduced]);
  return <motion.span ref={ref}>{display}</motion.span>;
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 50 });
  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}

export function AnimatedTabs({
  items,
  value,
  onChange,
  label,
  id = "tabs",
}: {
  items: { value: string; label: ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  id?: string;
}) {
  return (
    <RadixTabs.Root value={value} onValueChange={onChange}>
      <RadixTabs.List aria-label={label} className="tabs">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className="tab"
          >
            {value === item.value && (
              <motion.span
                className="tab-background"
                layoutId={id}
                transition={{ type: "spring", bounce: 0.12, duration: 0.45 }}
              />
            )}
            <span>{item.label}</span>
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}

export function TransitionPanel({
  children,
  value,
}: {
  children: ReactNode;
  value: string;
}) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={value}
        initial={{ opacity: 0.4, y: reduced ? 0 : 7 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0.4, y: reduced ? 0 : -5 }}
        transition={{ duration: 0.16 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function FAQAccordion({
  items,
}: {
  items: readonly { q: string; a: string }[];
}) {
  return (
    <Accordion.Root type="single" collapsible className="accordion">
      {items.map((item, i) => (
        <Accordion.Item
          className="accordion-item"
          value={String(i)}
          key={item.q}
        >
          <Accordion.Header>
            <Accordion.Trigger className="accordion-trigger">
              {item.q}
              <Plus size={20} aria-hidden="true" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="accordion-content">
            <div>
              <p>{item.a}</p>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

export function CodeBlock({
  code,
  title = "Terminal",
}: {
  code: string | readonly string[];
  title?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const text = typeof code === "string" ? code : code.join("\n");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text.replace(/^\$ /gm, ""));
      setState("copied");
    } catch {
      setState("error");
    }
    timer.current = setTimeout(() => setState("idle"), 2500);
  }
  return (
    <div className="code-block">
      <div className="code-header">
        <span>
          <span className="terminal-dot" />
          {title}
        </span>
        <button onClick={copy} aria-label="Copy code">
          {state === "copied" ? <Check size={16} /> : <Copy size={16} />}
          <span aria-live="polite">
            {state === "copied"
              ? "Copied"
              : state === "error"
                ? "Copy failed. Select code below."
                : "Copy"}
          </span>
        </button>
      </div>
      <pre tabIndex={0}>
        <code>{text}</code>
      </pre>
    </div>
  );
}

export function Carousel({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ start: true, end: false });
  const update = () => {
    const e = ref.current;
    if (e)
      setPosition({
        start: e.scrollLeft < 5,
        end: e.scrollLeft + e.clientWidth >= e.scrollWidth - 5,
      });
  };
  useEffect(() => {
    update();
    const e = ref.current;
    if (!e) return;
    const obs = new ResizeObserver(update);
    obs.observe(e);
    return () => obs.disconnect();
  }, []);
  return (
    <div className="carousel">
      <div
        className="carousel-track"
        ref={ref}
        onScroll={update}
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>
      <div className="carousel-controls">
        <span>Explore the collection</span>
        <div>
          <button
            className="icon-button"
            aria-label="Previous games"
            disabled={position.start}
            onClick={() =>
              ref.current?.scrollBy({
                left: -ref.current.clientWidth * 0.75,
                behavior: "smooth",
              })
            }
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="icon-button"
            aria-label="Next games"
            disabled={position.end}
            onClick={() =>
              ref.current?.scrollBy({
                left: ref.current.clientWidth * 0.75,
                behavior: "smooth",
              })
            }
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
