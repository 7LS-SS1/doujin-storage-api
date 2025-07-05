'use client'
import { useState } from 'react'

import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, NextUIProvider } from '@nextui-org/react'

export default function TestModal() {
  const [open, setOpen] = useState(false)

  return (
    <NextUIProvider>
      <Button onPress={() => setOpen(true)}>Open Modal</Button>
      <Modal isOpen={open} onClose={() => setOpen(false)}>
        <ModalContent>
          <ModalHeader>Test Modal</ModalHeader>
          <ModalBody>It works!</ModalBody>
          <ModalFooter>
            <Button onPress={() => setOpen(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </NextUIProvider>
  )
}
