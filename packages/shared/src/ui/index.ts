export function createButton(
  text: string,
  className = "",
  onClick?: (event: MouseEvent) => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.className = ["hub-button", className].filter(Boolean).join(" ");
  button.addEventListener("click", (event) => onClick?.(event));
  return button;
}

export function createLabel(text: string, htmlFor?: string): HTMLLabelElement {
  const label = document.createElement("label");
  label.textContent = text;
  label.className = "hub-label";

  if (htmlFor) {
    label.htmlFor = htmlFor;
  }

  return label;
}

export function createTextInput(value = "", placeholder = ""): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.placeholder = placeholder;
  input.className = "hub-input";
  return input;
}

export function createRow(...children: HTMLElement[]): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "hub-row";
  row.append(...children);
  return row;
}

export function createCard(...children: HTMLElement[]): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "hub-card";
  card.append(...children);
  return card;
}

export function clearElement(element: HTMLElement): void {
  element.replaceChildren();
}

export type StatusView = {
  set: (message: string, isError?: boolean) => void;
};

export function createStatusView(element: HTMLElement | null): StatusView {
  return {
    set(message, isError = false) {
      if (!element) {
        return;
      }

      element.textContent = message;
      element.classList.toggle("hub-status-error", isError);
      element.classList.toggle("hub-status-success", !isError && message.length > 0);
    },
  };
}

export type DisclosureControls = {
  root: HTMLDetailsElement;
  summary: HTMLElement;
  content: HTMLDivElement;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

type DisclosureChild = HTMLElement | DocumentFragment;

function appendChildren(target: HTMLElement, children: readonly DisclosureChild[]): void {
  target.append(...children);
}

export function createDisclosure(options: {
  label: string;
  children: readonly DisclosureChild[];
  defaultOpen?: boolean;
  className?: string;
  summaryClassName?: string;
  contentClassName?: string;
}): DisclosureControls {
  const root = document.createElement("details");
  root.className = ["hub-disclosure", options.className].filter(Boolean).join(" ");
  root.open = options.defaultOpen === true;

  const summary = document.createElement("summary");
  summary.className = ["hub-disclosure-summary", options.summaryClassName]
    .filter(Boolean)
    .join(" ");
  summary.textContent = options.label;

  const content = document.createElement("div");
  content.className = ["hub-disclosure-content", options.contentClassName]
    .filter(Boolean)
    .join(" ");
  appendChildren(content, options.children);

  root.append(summary, content);

  return {
    root,
    summary,
    content,
    get isOpen() {
      return root.open;
    },
    setOpen(open) {
      root.open = open;
    },
  };
}

export function createAdvancedSettings(
  children: readonly DisclosureChild[],
  options: {
    label?: string;
    defaultOpen?: boolean;
    className?: string;
  } = {},
): DisclosureControls {
  return createDisclosure({
    label: options.label ?? "Advanced settings",
    children,
    defaultOpen: options.defaultOpen === true,
    className: ["hub-advanced", options.className].filter(Boolean).join(" "),
    summaryClassName: "hub-advanced-summary",
    contentClassName: "hub-advanced-content",
  });
}
