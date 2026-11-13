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
