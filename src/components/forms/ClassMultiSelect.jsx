import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />
const checkedIcon = <CheckBoxIcon fontSize="small" />

/**
 * Material UI multi-select with removable chips.
 */
export default function ClassMultiSelect({
  options = [],
  value = [],
  onChange,
  disabled = false,
  placeholder = 'Class',
}) {
  const selected = options.filter((opt) =>
    value.map(String).includes(String(opt.cg_id)),
  )

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      size="small"
      limitTags={1}
      disabled={disabled}
      options={options}
      value={selected}
      onChange={(_, next) => onChange(next.map((o) => String(o.cg_id)))}
      getOptionLabel={(opt) => opt.cg_name || ''}
      isOptionEqualToValue={(a, b) => String(a.cg_id) === String(b.cg_id)}
      noOptionsText="No classes for this year"
      renderOption={(props, option, { selected: isSelected }) => {
        const { key, ...rest } = props
        return (
          <li key={key} {...rest}>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8 }}
              checked={isSelected}
            />
            {option.cg_name}
          </li>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={selected.length ? '' : placeholder}
          inputProps={{
            ...params.inputProps,
            'aria-label': placeholder,
          }}
        />
      )}
      sx={{
        width: '100%',
        maxWidth: '11.5rem',
        '& .MuiChip-root': {
          maxWidth: '6.5rem',
        },
      }}
    />
  )
}
