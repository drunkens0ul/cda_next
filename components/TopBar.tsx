'use client'

import { memo } from 'react'
import LanguageSwitcher from './LanguageSwitcher'

function TopBar() {
  return (
    <div style={{ backgroundColor: '#DBEDFF' }} className="border-b border-gray-200">
      <div className="container-custom py-2">
        <div className="flex justify-start">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  )
}

export default memo(TopBar)
