import { createTheme } from '@mui/material/styles'
import { theme as brand } from '@/config/appConfig'

/**
 * Shared MUI theme mapped to brand colors from appConfig.
 */
export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand.colors.goldDeep,
      light: brand.colors.gold,
      dark: '#4f3c14',
      contrastText: brand.colors.white,
    },
    secondary: {
      main: brand.colors.panel,
      light: brand.colors.panel2,
      contrastText: brand.colors.white,
    },
    error: {
      main: brand.colors.danger,
    },
    text: {
      primary: brand.colors.ink,
      secondary: brand.colors.inkSoft,
    },
    background: {
      default: brand.colors.paper,
      paper: brand.colors.paperSoft,
    },
    divider: brand.colors.line,
  },
  typography: {
    fontFamily: brand.fonts.body,
    button: {
      textTransform: 'none',
      fontWeight: 650,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiButton: {
      defaultProps: {
        size: 'medium',
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 650,
        },
        containedPrimary: {
          background: `linear-gradient(120deg, ${brand.colors.goldSoft}, ${brand.colors.gold}, #a8893a)`,
          color: brand.colors.panel,
          '&:hover': {
            background: `linear-gradient(120deg, ${brand.colors.gold}, #a8893a)`,
          },
        },
        outlined: {
          borderColor: 'rgba(20, 35, 28, 0.18)',
          color: brand.colors.inkSoft,
          '&:hover': {
            borderColor: brand.colors.gold,
            background: 'rgba(196, 163, 90, 0.08)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(111, 86, 32, 0.45)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brand.colors.gold,
            borderWidth: 1.5,
          },
        },
        notchedOutline: {
          borderColor: 'rgba(20, 35, 28, 0.22)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(196, 163, 90, 0.2)',
          border: '1px solid rgba(196, 163, 90, 0.35)',
          color: brand.colors.goldDeep,
          fontWeight: 650,
        },
        deleteIcon: {
          color: brand.colors.goldDeep,
          '&:hover': {
            color: brand.colors.ink,
          },
        },
      },
    },
  },
})
