import {
    Button,
    Chip,
    ChipGroup,
    Divider,
    Menu,
    MenuContent,
    MenuItem,
    MenuList,
    Popper,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities,
} from '@patternfly/react-core'
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon'
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon'
import { useEffect, useRef, useState } from 'react'

function formatSearchSelections(currentSelections: string[]) {
    const searchChipObjects = currentSelections.map((chip: string) => {
        const colonIdx = chip.indexOf(':')
        return { attribute: chip.slice(0, colonIdx), value: chip.slice(colonIdx + 2, chip.length) }
    })
    const formattedSelections: Record<string, string[]> = {}
    searchChipObjects.forEach((selection) => {
        if (Object.keys(formattedSelections).includes(selection.attribute)) {
            formattedSelections[selection.attribute] = [...formattedSelections[selection.attribute], selection.value]
        } else {
            formattedSelections[selection.attribute] = [selection.value]
        }
    })
    return formattedSelections
}

export default function CardViewToolbarSearch(props: {
    searchData: any
    dataKeyNames: string[]
    setSearchFilter: React.Dispatch<React.SetStateAction<Record<string, string[]>>>
}) {
    const { searchData, dataKeyNames, setSearchFilter } = props
    const [inputValue, setInputValue] = useState<string>('')
    const [selectedKey, setSelectedKey] = useState<string>('')
    const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false)
    const [currentChips, setCurrentChips] = useState<string[]>([])
    const [menuItemsText, setMenuItemsText] = useState<string[]>(dataKeyNames)
    const [menuItems, setMenuItems] = useState<JSX.Element[]>([])

    /** refs used to detect when clicks occur inside vs outside of the textInputGroup and menu popper */
    const menuRef = useRef<any>(null)
    const textInputGroupRef = useRef<any>(null)

    /** callback for updating the inputValue state in this component so that the input can be controlled */
    const handleInputChange = (target: HTMLInputElement) => {
        setInputValue(target.value)
    }

    /** callback for removing a chip from the chip selections */
    const deleteChip = (chipToDelete: any) => {
        const newChips = currentChips.filter((chip) => !Object.is(chip, chipToDelete))
        setCurrentChips(newChips)
        setSearchFilter(formatSearchSelections(newChips))
    }

    /** reset state hooks associated with key selection */
    const clearSelectedKey = () => {
        setInputValue('')
        setSelectedKey('')
        setMenuItemsText(dataKeyNames)
    }

    /** callback for clearing all selected chips, the text input, and any selected keys */
    const clearChipsAndInput = () => {
        setCurrentChips([])
        clearSelectedKey()
        setSearchFilter({})
    }

    useEffect(() => {
        /** in the menu only show items that include the text in the input */
        const filteredMenuItems = menuItemsText
            .filter(
                (item) =>
                    !inputValue ||
                    item.toLowerCase().includes(
                        inputValue
                            .toString()
                            .slice(selectedKey.length && selectedKey.length + 2)
                            .toLowerCase()
                    )
            )
            .map((currentValue, index) => (
                <MenuItem key={currentValue} itemId={index}>
                    {currentValue}
                </MenuItem>
            ))

        /** in the menu show a disabled "no result" when all menu items are filtered out */
        if (filteredMenuItems.length === 0) {
            const noResultItem = (
                <MenuItem isDisabled key="no result">
                    No results found
                </MenuItem>
            )
            setMenuItems([noResultItem])
            return
        }

        /** determine the menu heading text based on key selection; or lack thereof */
        const headingItem = (
            <MenuItem isDisabled key="heading">
                {selectedKey.length ? `${selectedKey} values` : 'Attributes'}
            </MenuItem>
        )

        const divider = <Divider key="divider" />
        setMenuItems([headingItem, divider, ...filteredMenuItems])
    }, [inputValue])

    /** add selected key/value pair as a chip in the chip group */
    const selectValue = (selectedValue: string) => {
        const chips = [...currentChips, `${selectedKey}: ${selectedValue}`]
        setCurrentChips(chips)
        setSearchFilter(formatSearchSelections(chips))
        clearSelectedKey()
    }

    /** update the input to show the selected key and the menu to show the values associated with that specific key */
    const selectKey = (selectedText: string) => {
        setInputValue(`${selectedText}: `)
        setSelectedKey(selectedText)
        setMenuItemsText(searchData[selectedText])
    }

    const handleEnter = () => {
        /** do nothing if the menu contains no real results */
        if (menuItems.length === 1) {
            return
        }

        /** perform the appropriate action based on key selection state */
        if (selectedKey.length) {
            selectValue(menuItems[2].props.children)
        } else {
            selectKey(menuItems[2].props.children)
        }
    }

    /** allow the user to backspace at the selected key name to drop the currently selected key */
    const handleBackspace = () => {
        if (selectedKey.length && inputValue === `${selectedKey}: `) {
            clearSelectedKey()
        }
    }

    /** allow the user to select a key by simply typing it and entering a colon, exact (case sensitive) matches only */
    const handleColon = () => {
        if (!selectedKey.length && dataKeyNames.includes(inputValue)) {
            selectKey(inputValue)
            event && event.preventDefault()
        }
    }

    /** allow the user to focus on the menu and navigate using the arrow keys */
    const handleArrowKey = () => {
        if (menuRef.current) {
            const firstElement = menuRef.current.querySelector('li > button:not(:disabled)')
            firstElement && firstElement.focus()
        }
    }

    /** enable keyboard only usage */
    const handleTextInputKeyDown = (event: any) => {
        switch (event.key) {
            case 'Enter':
                handleEnter()
                break
            case 'Escape':
                clearSelectedKey()
                break
            case 'Backspace':
                handleBackspace()
                break
            case ':':
                handleColon()
                break
            case 'ArrowUp':
            case 'ArrowDown':
                handleArrowKey()
                break
        }
    }

    /** perform the proper key or value selection when a menu item is selected */
    const onSelect = (event: React.MouseEvent<Element, MouseEvent>) => {
        const target = event.target as HTMLElement
        const selectedText = target.innerText

        if (selectedKey.length) {
            selectValue(selectedText)
        } else {
            selectKey(selectedText)
        }
        event.stopPropagation()
        textInputGroupRef.current.querySelector('input').focus()
    }

    /** close the menu when a click occurs outside of the menu or text input group */
    const handleClick = (event: MouseEvent) => {
        if (
            menuRef.current &&
            !menuRef.current.contains(event.target) &&
            textInputGroupRef &&
            !textInputGroupRef?.current?.contains(event.target)
        ) {
            setMenuIsOpen(false)
        }
    }

    /** only show the search icon when no chips are selected */
    const showSearchIcon = !currentChips.length

    /** only show the clear button when there is something that can be cleared */
    const showClearButton = inputValue || !!currentChips.length

    const inputGroup = (
        <div ref={textInputGroupRef}>
            <TextInputGroup>
                <TextInputGroupMain
                    icon={showSearchIcon && <SearchIcon />}
                    value={inputValue}
                    onChange={() => {
                        const target = event!.target as HTMLInputElement
                        handleInputChange(target)
                    }}
                    onFocus={() => setMenuIsOpen(true)}
                    onKeyDown={handleTextInputKeyDown}
                >
                    <ChipGroup>
                        {currentChips.map((currentChip) => (
                            <Chip key={currentChip} onClick={() => deleteChip(currentChip)}>
                                {currentChip}
                            </Chip>
                        ))}
                    </ChipGroup>
                </TextInputGroupMain>
                <TextInputGroupUtilities>
                    {showClearButton && (
                        <Button variant="plain" onClick={clearChipsAndInput} aria-label="Clear button and input">
                            <TimesIcon />
                        </Button>
                    )}
                </TextInputGroupUtilities>
            </TextInputGroup>
        </div>
    )

    const menu = (
        <div ref={menuRef}>
            <Menu onSelect={(event) => onSelect(event as React.MouseEvent<Element, MouseEvent>)}>
                <MenuContent>
                    <MenuList>{menuItems}</MenuList>
                </MenuContent>
            </Menu>
        </div>
    )

    return (
        <Popper
            trigger={inputGroup}
            popper={menu}
            isVisible={menuIsOpen}
            onDocumentClick={(event) => handleClick(event as MouseEvent)}
        />
    )
}
