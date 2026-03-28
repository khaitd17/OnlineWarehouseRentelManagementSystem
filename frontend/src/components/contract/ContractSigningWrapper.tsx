import React from 'react';
import { useParams } from 'react-router-dom';
import ContractSigningPage from '../pages/ContractSigningPage';

interface ContractSigningWrapperProps {
  userRole: 'OWNER' | 'RENTER';
}

const ContractSigningWrapper: React.FC<ContractSigningWrapperProps> = ({ userRole }) => {
  const { contractId, extensionId } = useParams<{
    contractId: string;
    extensionId?: string;
  }>();

  return (
    <ContractSigningPage
      contractId={contractId ? parseInt(contractId, 10) : undefined}
      extensionId={extensionId ? parseInt(extensionId, 10) : undefined}
      userRole={userRole}
    />
  );
};

export default ContractSigningWrapper;