import { useState } from "react";

export const useModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const showModal = (record = null) => {
    setEditingRecord(record);
    setIsVisible(true);
  };

  const hideModal = () => {
    setIsVisible(false);
    setEditingRecord(null);
  };

  return {
    isVisible,
    editingRecord,
    showModal,
    hideModal,
  };
};