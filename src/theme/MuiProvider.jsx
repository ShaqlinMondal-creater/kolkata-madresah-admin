import { ThemeProvider } from '@mui/material/styles'
import { muiTheme } from '@/theme/muiTheme'

export default function MuiProvider({ children }) {
  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
}
