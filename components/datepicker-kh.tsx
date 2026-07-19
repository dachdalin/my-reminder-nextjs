import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import ClickOutside from "./click-outside";

interface DatePickerWithKhmerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value"> {
    value?: string;
    onChange?: (value: string) => void;
    locale?: "km" | "en";
    error?: string;
    label?: string;
}

const KHMER_MONTHS = [
    "មករា",
    "កុម្ភៈ",
    "មីនា",
    "មេសា",
    "ឧសភា",
    "មិថុនា",
    "កក្កដា",
    "សីហា",
    "កញ្ញា",
    "តុលា",
    "វិច្ឆិកា",
    "ធ្នូ",
];

const ENGLISH_MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

const KHMER_WEEKDAYS = ["អាទិត្យ", "ចន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
const ENGLISH_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const KHMER_NUMERALS: Record<string, string> = {
    "0": "០",
    "1": "១",
    "2": "២",
    "3": "៣",
    "4": "៤",
    "5": "៥",
    "6": "៦",
    "7": "៧",
    "8": "៨",
    "9": "៩",
};

const toKhmerNumerals = (value: string): string => value.replace(/\d/g, (digit) => KHMER_NUMERALS[digit] ?? digit);

const formatDateValue = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const parseDateValue = (value?: string): Date | null => {
    if (!value) {
        return null;
    }

    const parts = value.split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return null;
    }

    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    return date;
};

const isSameDay = (first: Date, second: Date): boolean => formatDateValue(first) === formatDateValue(second);

const getMonthDays = (viewDate: Date): Date[] => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(year, month, 1 - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);

        return date;
    });
};

const isDisabledByBounds = (date: Date, min?: string | number, max?: string | number): boolean => {
    const minDate = parseDateValue(min ? String(min) : undefined);
    const maxDate = parseDateValue(max ? String(max) : undefined);
    const comparableDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    if (minDate && comparableDate < minDate.getTime()) {
        return true;
    }

    if (maxDate && comparableDate > maxDate.getTime()) {
        return true;
    }

    return false;
};

const getDisplayValue = (dateValue: string, locale: "km" | "en"): string => {
    const date = parseDateValue(dateValue);

    if (!date) {
        return "";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const monthName = locale === "km" ? KHMER_MONTHS[date.getMonth()] : ENGLISH_MONTHS[date.getMonth()];
    const year = String(date.getFullYear());

    if (locale === "km") {
        return `${toKhmerNumerals(day)} ${monthName} ${toKhmerNumerals(year)}`;
    }

    return `${monthName} ${day}, ${year}`;
};

const getYearOptions = (viewYear: number): number[] => {
    const startYear = Math.min(1900, viewYear - 20);
    const endYear = Math.max(2100, viewYear + 20);

    return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
};

const getPageLeftBoundary = (edgePadding: number): number => {
    const sidebar = document.getElementById("sidebar");

    if (!sidebar) {
        return edgePadding;
    }

    const rect = sidebar.getBoundingClientRect();
    const isVisibleOnLeft = rect.left <= edgePadding && rect.right > edgePadding && rect.width > 0;

    return isVisibleOnLeft ? rect.right : edgePadding;
};

interface CalendarPosition {
    left: number;
    top: number;
    width: number;
    maxHeight: number;
}

export default function DatePickerWithKhmer({
    value = "",
    onChange,
    locale = "km",
    error,
    label,
    placeholder = locale === "km" ? "ជ្រើសរើសកាលបរិច្ឆេទ" : "Select date",
    disabled = false,
    min,
    max,
    id,
    name,
    ...props
}: DatePickerWithKhmerProps): React.ReactElement {
    const selectedDate = parseDateValue(value);
    const initialViewDateRef = useRef(selectedDate ?? new Date());
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(initialViewDateRef.current);
    const [calendarPosition, setCalendarPosition] = useState<CalendarPosition | null>(null);
    const inputId = id ?? name;

    useEffect(() => {
        const nextSelectedDate = parseDateValue(value);

        if (nextSelectedDate) {
            setViewDate(nextSelectedDate);
        }
    }, [value]);

    const monthDays = useMemo(() => getMonthDays(viewDate), [viewDate]);
    const yearOptions = useMemo(() => getYearOptions(viewDate.getFullYear()), [viewDate]);
    const today = useMemo(() => new Date(), []);
    const displayValue = getDisplayValue(value, locale);
    const months = locale === "km" ? KHMER_MONTHS : ENGLISH_MONTHS;
    const weekdays = locale === "km" ? KHMER_WEEKDAYS : ENGLISH_WEEKDAYS;

    const updateCalendarPosition = useCallback((): void => {
        const inputContainer = inputContainerRef.current;

        if (!inputContainer) {
            return;
        }

        const rect = inputContainer.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const gap = 8;
        const edgePadding = 16;
        const leftBoundary = getPageLeftBoundary(edgePadding);
        const preferredWidth = 432;
        const width = Math.min(preferredWidth, viewportWidth - leftBoundary - edgePadding);
        const left = Math.min(Math.max(rect.left, leftBoundary), viewportWidth - width - edgePadding);
        const estimatedHeight = 520;
        const spaceBelow = viewportHeight - rect.bottom - edgePadding;
        const spaceAbove = rect.top - edgePadding;
        const shouldOpenAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
        const top = shouldOpenAbove
            ? Math.max(edgePadding, rect.top - gap - Math.min(estimatedHeight, spaceAbove))
            : rect.bottom + gap;
        const maxHeight = shouldOpenAbove
            ? Math.max(320, rect.top - edgePadding - gap)
            : Math.max(320, viewportHeight - rect.bottom - edgePadding - gap);

        setCalendarPosition({ left, top, width, maxHeight });
    }, []);

    const openCalendar = (): void => {
        if (!disabled) {
            setIsOpen(true);
        }
    };

    const closeCalendar = (): void => {
        setIsOpen(false);
    };

    const moveMonth = (direction: -1 | 1): void => {
        setViewDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    };

    const selectMonth = (monthIndex: number): void => {
        setViewDate((currentDate) => new Date(currentDate.getFullYear(), monthIndex, 1));
    };

    const selectYear = (year: number): void => {
        setViewDate((currentDate) => new Date(year, currentDate.getMonth(), 1));
    };

    const selectDate = (date: Date): void => {
        if (isDisabledByBounds(date, min, max)) {
            return;
        }

        onChange?.(formatDateValue(date));
        setIsOpen(false);
    };

    const clearDate = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.preventDefault();
        event.stopPropagation();
        onChange?.("");
        setIsOpen(false);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openCalendar();
        }

        if (event.key === "Escape") {
            closeCalendar();
        }
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        updateCalendarPosition();

        window.addEventListener("resize", updateCalendarPosition);
        window.addEventListener("scroll", updateCalendarPosition, true);

        return () => {
            window.removeEventListener("resize", updateCalendarPosition);
            window.removeEventListener("scroll", updateCalendarPosition, true);
        };
    }, [isOpen, updateCalendarPosition]);

    const calendar = isOpen ? (
        <div
            ref={calendarRef}
            role="dialog"
            aria-modal="false"
            className="fixed z-[100000] overflow-hidden rounded-lg border border-border bg-card shadow-lg dark:border-border"
            style={{
                left: calendarPosition?.left ?? 0,
                top: calendarPosition?.top ?? 0,
                width: calendarPosition?.width ?? 432,
                maxHeight: calendarPosition?.maxHeight ?? "calc(100dvh - 2rem)",
                visibility: calendarPosition ? "visible" : "hidden",
            }}
        >
            <div className="max-h-[inherit] overflow-y-auto">
                <div className="flex items-center justify-between gap-2 bg-primary px-3 py-3 text-primary-foreground">
                    <button
                        type="button"
                        onClick={() => moveMonth(-1)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/15"
                        aria-label={locale === "km" ? "ខែមុន" : "Previous month"}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="grid flex-1 grid-cols-2 gap-2">
                        <select
                            value={viewDate.getMonth()}
                            onChange={(event) => selectMonth(Number(event.target.value))}
                            className="h-9 rounded-md border border-primary-foreground/20 bg-primary-foreground/15 px-2 text-center text-sm font-semibold text-primary-foreground outline-none transition focus:border-primary-foreground [&_option]:text-foreground [&_option]:bg-card"
                            aria-label={locale === "km" ? "ជ្រើសរើសខែ" : "Select month"}
                        >
                            {months.map((month, index) => (
                                <option key={month} value={index}>
                                    {month}
                                </option>
                            ))}
                        </select>

                        <select
                            value={viewDate.getFullYear()}
                            onChange={(event) => selectYear(Number(event.target.value))}
                            className="h-9 rounded-md border border-primary-foreground/20 bg-primary-foreground/15 px-2 text-center text-sm font-semibold text-primary-foreground outline-none transition focus:border-primary-foreground [&_option]:text-foreground [&_option]:bg-card"
                            aria-label={locale === "km" ? "ជ្រើសរើសឆ្នាំ" : "Select year"}
                        >
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>
                                    {locale === "km" ? toKhmerNumerals(String(year)) : year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => moveMonth(1)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/15"
                        aria-label={locale === "km" ? "ខែបន្ទាប់" : "Next month"}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-7 bg-primary text-primary-foreground">
                    {weekdays.map((weekday) => (
                        <div key={weekday} className="border-r border-primary-foreground/20 px-1 py-2 text-center text-xs font-bold last:border-r-0 sm:text-sm">
                            {weekday}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 border-l border-t border-border bg-card dark:border-border">
                    {monthDays.map((date) => {
                        const isCurrentMonth = date.getMonth() === viewDate.getMonth();
                        const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                        const isToday = isSameDay(date, today);
                        const isDisabled = isDisabledByBounds(date, min, max);
                        const dayNumber = String(date.getDate());

                        return (
                            <button
                                key={formatDateValue(date)}
                                type="button"
                                onClick={() => selectDate(date)}
                                disabled={isDisabled}
                                className={`flex aspect-square min-h-12 flex-col items-center justify-center gap-0.5 border-b border-r border-border p-1 text-center transition ${
                                    isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : isCurrentMonth
                                          ? "bg-card text-foreground hover:bg-primary/10 dark:bg-card"
                                          : "bg-muted text-muted-foreground/40 hover:bg-muted/80"
                                } ${isToday && !isSelected ? "ring-2 ring-inset ring-primary/70" : ""} ${
                                    isDisabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : ""
                                }`}
                                aria-label={getDisplayValue(formatDateValue(date), locale)}
                            >
                                <span className={`text-base font-bold leading-none sm:text-lg ${isCurrentMonth ? "" : "opacity-60"}`}>
                                    {locale === "km" ? toKhmerNumerals(dayNumber) : dayNumber}
                                </span>
                                <span className={`text-[0.62rem] leading-tight sm:text-xs ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                                    {locale === "km"
                                        ? `${months[date.getMonth()]}`
                                        : months[date.getMonth()].slice(0, 3)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted px-4 py-3 text-sm">
                    <button
                        type="button"
                        onClick={() => {
                            const currentDate = new Date();

                            setViewDate(currentDate);
                            selectDate(currentDate);
                        }}
                        className="font-medium text-primary transition hover:text-primary/80"
                    >
                        {locale === "km" ? "ថ្ងៃនេះ" : "Today"}
                    </button>
                    <span className="truncate text-muted-foreground">
                        {displayValue || (locale === "km" ? "មិនទាន់ជ្រើសរើស" : "No date selected")}
                    </span>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <div className="w-full">
            {label ? (
                <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-foreground">
                    {label}
                </label>
            ) : null}

            <ClickOutside onClick={closeCalendar} exceptionRef={calendarRef} className="relative">
                <input type="hidden" name={name} value={value} readOnly />

                <div ref={inputContainerRef} className="relative">
                    <input
                        {...props}
                        id={inputId}
                        type="text"
                        value={displayValue}
                        onChange={() => {}}
                        onClick={openCalendar}
                        onFocus={openCalendar}
                        onKeyDown={handleInputKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        readOnly
                        aria-haspopup="dialog"
                        aria-expanded={isOpen}
                        aria-invalid={!!error}
                        className={`relative w-full rounded-md border bg-background px-4 py-2.5 pr-18 text-sm text-foreground outline-none transition placeholder:text-muted-foreground ${
                            error
                                ? "border-destructive"
                                : "border-input focus:border-primary focus:ring-2 focus:ring-primary/10 active:border-primary"
                        } ${disabled ? "cursor-default bg-muted" : "cursor-pointer"}`}
                        lang={locale === "km" ? "km-KH" : "en-US"}
                    />

                    {value && !disabled ? (
                        <button
                            type="button"
                            onClick={clearDate}
                            className="absolute right-10 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-destructive"
                            title={locale === "km" ? "សម្អាត" : "Clear"}
                            aria-label={locale === "km" ? "សម្អាតកាលបរិច្ឆេទ" : "Clear date"}
                        >
                            <X size={16} />
                        </button>
                    ) : null}

                    <button
                        type="button"
                        onClick={openCalendar}
                        disabled={disabled}
                        className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        title={locale === "km" ? "បើកប្រតិទិន" : "Open calendar"}
                        aria-label={locale === "km" ? "បើកប្រតិទិន" : "Open calendar"}
                    >
                        <CalendarDays size={16} />
                    </button>
                </div>

                {calendar && typeof document !== "undefined" ? createPortal(calendar, document.body) : null}
            </ClickOutside>

            {error ? <p className="mt-1.5 text-sm text-destructive">{error}</p> : null}
        </div>
    );
}
