'use client';
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { Close, Search } from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';

interface StockTableHeaderProps {
  title: string;
  bgColor: string;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const StockTableHeader = ({
  title,
  bgColor,
  searchTerm,
  onSearchTermChange,
}: StockTableHeaderProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  const handleOpenSearch = () => setSearchOpen(true);

  const handleCloseSearch = () => {
    setSearchOpen(false);
    onSearchTermChange('');
  };

  const handleClear = () => {
    onSearchTermChange('');
    inputRef.current?.focus();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 1,
        bgcolor: bgColor,
        px: 1,
        py: 0.5,
        minHeight: 48,
        overflow: 'hidden',
      }}
    >
      <Typography variant="h6" noWrap sx={{ flexShrink: 0 }}>
        {title}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flex: 1,
          minWidth: 0,
          gap: 0.5,
        }}
      >
        <Box
          sx={{
            flex: searchOpen ? 1 : 0,
            maxWidth: searchOpen ? '100%' : 0,
            opacity: searchOpen ? 1 : 0,
            transition:
              'flex 0.3s ease, max-width 0.3s ease, opacity 0.25s ease',
            overflow: 'hidden',
          }}
        >
          <TextField
            inputRef={inputRef}
            size="small"
            fullWidth
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            slotProps={{
              input: {
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={handleClear}
                      aria-label="Limpiar búsqueda"
                      edge="end"
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: { bgcolor: 'white', borderRadius: 1 },
              },
            }}
          />
        </Box>

        <IconButton
          onClick={searchOpen ? handleCloseSearch : handleOpenSearch}
          aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar'}
          size="small"
          sx={{ flexShrink: 0 }}
        >
          {searchOpen ? <Close /> : <Search />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default StockTableHeader;
