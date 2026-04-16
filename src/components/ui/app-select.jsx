import React from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY_VALUE_SENTINEL = "__APP_SELECT_EMPTY__";

export function AppSelectOption() {
  return null;
}
AppSelectOption.displayName = "AppSelectOption";

export function AppSelectGroup() {
  return null;
}
AppSelectGroup.displayName = "AppSelectGroup";

function flattenOptions(children, groupLabel = null) {
  const options = [];

  React.Children.forEach(children, (child) => {
    if (child === null || child === undefined || typeof child === "boolean") {
      return;
    }

    if (Array.isArray(child)) {
      options.push(...flattenOptions(child, groupLabel));
      return;
    }

    if (!React.isValidElement(child)) {
      return;
    }

    if (child.type === React.Fragment) {
      options.push(...flattenOptions(child.props.children, groupLabel));
      return;
    }

    if (child.type === AppSelectGroup || child.type?.displayName === "AppSelectGroup") {
      options.push(...flattenOptions(child.props.children, child.props.label ?? groupLabel));
      return;
    }

    if (child.type === AppSelectOption || child.type?.displayName === "AppSelectOption") {
      const rawValue = child.props.value ?? "";
      options.push({
        value: rawValue === "" ? EMPTY_VALUE_SENTINEL : String(rawValue),
        originalValue: rawValue,
        label: child.props.children,
        disabled: !!child.props.disabled,
        className: child.props.className,
        groupLabel,
      });
    }
  });

  return options;
}

export function AppSelect({
  children,
  value,
  onChange,
  className,
  disabled,
  id,
  name,
  required,
  placeholder,
  defaultValue,
  onBlur,
  ...props
}) {
  const options = React.useMemo(() => flattenOptions(children), [children]);
  const normalizedValue = value === null || value === undefined ? undefined : (value === "" ? EMPTY_VALUE_SENTINEL : String(value));
  const normalizedDefaultValue = defaultValue === null || defaultValue === undefined ? undefined : (defaultValue === "" ? EMPTY_VALUE_SENTINEL : String(defaultValue));
  const firstAvailableValue = options.find((option) => !option.disabled)?.value;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(() => normalizedDefaultValue ?? firstAvailableValue);

  React.useEffect(() => {
    if (isControlled) return;
    const selectedValue = internalValue;
    const isStillValid = selectedValue !== undefined && options.some((option) => option.value === selectedValue);
    if (!isStillValid) {
      setInternalValue(normalizedDefaultValue ?? firstAvailableValue);
    }
  }, [firstAvailableValue, internalValue, isControlled, normalizedDefaultValue, options]);

  const currentValue = isControlled ? normalizedValue : internalValue;
  const hasValue = currentValue !== undefined && options.some((option) => option.value === currentValue);
  const groupedOptions = options.reduce((acc, option) => {
    const key = option.groupLabel ?? "__ungrouped__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(option);
    return acc;
  }, {});

  const handleValueChange = (nextValue) => {
    const actualValue = nextValue === EMPTY_VALUE_SENTINEL ? "" : nextValue;
    let mutatedValue = actualValue;
    const target = {
      name,
      get value() {
        return mutatedValue;
      },
      set value(next) {
        mutatedValue = next;
      },
    };
    const event = {
      target,
      currentTarget: target,
      type: "change",
    };

    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChange?.(event);

    if (!isControlled && mutatedValue !== actualValue) {
      setInternalValue(mutatedValue === "" ? EMPTY_VALUE_SENTINEL : String(mutatedValue));
    }
  };

  const triggerClassName = cn(
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black shadow-sm transition-colors focus:ring-2 focus:ring-black/10 data-[placeholder]:text-black/45",
    className
  );

  return (
    <>
      {(name || id) ? <input type="hidden" id={id} name={name} value={hasValue ? (currentValue === EMPTY_VALUE_SENTINEL ? "" : currentValue) : ""} required={required} /> : null}
      <Select value={hasValue ? currentValue : undefined} defaultValue={normalizedDefaultValue} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger
          className={triggerClassName}
          style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "rgba(17, 24, 39, 0.1)" }}
          onBlur={onBlur}
          {...props}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          className="border-black/10 bg-white text-black shadow-xl"
          style={{ backgroundColor: "#ffffff", color: "#111827", borderColor: "rgba(17, 24, 39, 0.1)" }}
        >
          {Object.entries(groupedOptions).map(([groupKey, groupItems]) => {
            if (groupKey === "__ungrouped__") {
              return groupItems.map((option) => (
                <SelectItem
                  key={`${groupKey}-${option.value}`}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn("text-black focus:bg-black/5 focus:text-black", option.className)}
                >
                  {option.label}
                </SelectItem>
              ));
            }

            return (
              <SelectGroup key={groupKey}>
                <SelectLabel className="text-xs font-semibold uppercase tracking-wide text-black/50">{groupKey}</SelectLabel>
                {groupItems.map((option) => (
                  <SelectItem
                    key={`${groupKey}-${option.value}`}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn("text-black focus:bg-black/5 focus:text-black", option.className)}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </>
  );
}

export default AppSelect;
