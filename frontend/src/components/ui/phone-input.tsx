import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Flag component with multiple fallback strategies
const FlagDisplay = ({ country, className = "w-6 h-4" }: { country: CountryOption; className?: string }) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  // Strategy 1: Try CDN image
  if (country.flagUrl && !imageError) {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <img
          src={country.flagUrl}
          alt={`${country.name} flag`}
          className={cn("object-cover rounded-sm border border-gray-200 transition-opacity", 
            imageLoaded ? "opacity-100" : "opacity-0", className)}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          style={{ minWidth: '24px', minHeight: '16px' }}
        />
        {/* Show emoji while image is loading */}
        {!imageLoaded && (
          <span 
            className="absolute inset-0 flex items-center justify-center text-sm"
            style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}
          >
            {country.flag}
          </span>
        )}
      </div>
    );
  }

  // Strategy 2: Fallback to emoji with enhanced styling
  return (
    <div 
      className={cn("flex items-center justify-center text-base", className)}
      style={{ 
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Twemoji Mozilla, sans-serif',
        minWidth: '24px',
        minHeight: '16px',
        fontSize: '16px',
        lineHeight: '16px'
      }}
    >
      {country.flag || country.code}
    </div>
  );
};

export interface CountryOption {
  id: string;
  name: string;
  code: string;
  phoneCode: string;
  flag: string;
  flagUrl?: string;
}

interface PhoneInputProps {
  countries: CountryOption[];
  selectedCountry?: string;
  phoneNumber?: string;
  onCountryChange?: (countryId: string) => void;
  onPhoneNumberChange?: (phoneNumber: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  countries,
  selectedCountry = "ID", // Default to Indonesia
  phoneNumber = "",
  onCountryChange,
  onPhoneNumberChange,
  placeholder = "Masukkan nomor telepon",
  disabled = false,
  className,
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCountryData = countries.find((country) => country.id === selectedCountry);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, spaces, hyphens, and parentheses
    let value = e.target.value.replace(/[^\d\s()-]/g, "");
    
    // Auto-format the phone number for better UX
    if (value.length > 0) {
      // Remove any existing formatting
      const cleaned = value.replace(/\D/g, "");
      
      // Apply basic formatting based on length
      if (cleaned.length >= 10) {
        // Format as: 0812-3456-7890
        value = cleaned.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3");
      } else if (cleaned.length >= 8) {
        // Format as: 0812-3456-78
        value = cleaned.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
      } else if (cleaned.length >= 4) {
        // Format as: 0812-34
        value = cleaned.replace(/(\d{4})(\d+)/, "$1-$2");
      } else {
        value = cleaned;
      }
    }
    
    onPhoneNumberChange?.(value);
  };

  return (
    <div className={cn("flex", className)}>
      {/* Country Code Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[100px] justify-between rounded-r-none border-r-0"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              {selectedCountryData && (
                <FlagDisplay country={selectedCountryData} className="w-6 h-4" />
              )}
              <span className="text-sm font-mono font-medium">{selectedCountryData?.phoneCode}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Cari negara..." />
            <CommandList>
              <CommandEmpty>Negara tidak ditemukan.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.id}
                    value={`${country.name} ${country.phoneCode}`}
                    onSelect={() => {
                      onCountryChange?.(country.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <FlagDisplay country={country} className="w-6 h-4" />
                      <div className="flex-1">
                        <div className="font-medium">{country.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {country.phoneCode}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedCountry === country.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Phone Number Input */}
      <div className="relative flex-1">
        <Input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          disabled={disabled}
          className="rounded-l-none"
          inputMode="numeric"
          maxLength={15}
        />
      </div>
    </div>
  );
}
