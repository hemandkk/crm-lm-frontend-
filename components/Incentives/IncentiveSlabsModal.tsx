"use client";

import { Plus, Pencil, Trash2, Eye, Search, ReceiptText } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { IncentiveReportItem, IncentiveSlab } from "@/types";
import IncentiveSlabs from "./IncentiveSlabs";

interface Aggregated {
  mine: IncentiveReportItem | undefined;
  totalIncentive: number;
  totalLeads: number;
  dateFrom: string;
  dateTo: string;
  months: string[];
}
const IncentiveSlabsModal = ({
  open,
  onClose,
  slabs,
  aggregated,
}: {
  open: boolean;
  onClose: () => void;
  slabs: IncentiveSlab[] | undefined;
  aggregated: Aggregated | null;
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={"Incentive Slab Reference"}
      size="lg"
    >
      <IncentiveSlabs slabs={slabs} aggregated={aggregated} />
    </Modal>
  );
};

export default IncentiveSlabsModal;
