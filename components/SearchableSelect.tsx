
import React, { useState, useEffect, useRef, useMemo, forwardRef } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { PlusIcon } from './icons/PlusIcon';

export interface SearchableOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SearchableOption[];
    value: string;
    onChange: (value: string | null) => void;
    onAddNew?: () => void;
    placeholder?: string;
    addNewLabel?: string;
}

export const SearchableSelect = forwardRef<HTMLInputElement, SearchableSelectProps>(({
    options,
    value,
    onChange,
    onAddNew,
    placeholder = 'Tanlang...',
    addNewLabel = 'Yangi qo\'shish'
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = useMemo(() => options.find(o => o.value === value), [options, value]);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setHighlightedIndex(-1);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const handleSelectOption = (optionValue: string | null) => {
        if (optionValue === '__ADD_NEW__') {
            onAddNew?.();
        } else {
            onChange(optionValue);
        }
        setIsOpen(false);
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.blur();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const hasAddNew = !!onAddNew;
        const totalOptions = filteredOptions.length + (hasAddNew ? 1 : 0);
        if (totalOptions === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => (prev + 1) % totalOptions);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev - 1 + totalOptions) % totalOptions);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    if (hasAddNew && highlightedIndex === filteredOptions.length) {
                        handleSelectOption('__ADD_NEW__');
                    } else if (filteredOptions[highlightedIndex]) {
                        handleSelectOption(filteredOptions[highlightedIndex].value);
                    }
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };
    
     useEffect(() => {
        if (listRef.current && highlightedIndex >= 0) {
            const item = listRef.current.children[highlightedIndex] as HTMLLIElement;
            item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [highlightedIndex]);

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative" onClick={() => setIsOpen(!isOpen)}>
                 <input
                    ref={ref}
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    value={isOpen ? searchTerm : selectedOption?.label || ''}
                    onChange={e => {
                        if(!isOpen) setIsOpen(true);
                        setSearchTerm(e.target.value)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedOption?.label || placeholder}
                />
                <ChevronDownIcon className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-transform pointer-events-none ${isOpen ? 'rotate-180' : ''}`} />
            </div>
           
            {isOpen && (
                <ul ref={listRef} className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.map((option, index) => (
                        <li
                            key={option.value}
                            className={`px-3 py-2 cursor-pointer hover:bg-amber-50 ${highlightedIndex === index ? 'bg-amber-100' : ''} ${value === option.value ? 'font-semibold bg-slate-100' : ''}`}
                            onClick={() => handleSelectOption(option.value)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            {option.label}
                        </li>
                    ))}
                    {onAddNew && (
                         <li
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-amber-600 font-semibold hover:bg-amber-50 ${highlightedIndex === filteredOptions.length ? 'bg-amber-100' : ''}`}
                            onClick={() => handleSelectOption('__ADD_NEW__')}
                            onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                        >
                           <PlusIcon className="h-4 w-4" /> {addNewLabel}
                        </li>
                    )}
                     {filteredOptions.length === 0 && !onAddNew && (
                        <li className="px-3 py-2 text-slate-500">Natijalar topilmadi.</li>
                    )}
                </ul>
            )}
        </div>
    );
});
