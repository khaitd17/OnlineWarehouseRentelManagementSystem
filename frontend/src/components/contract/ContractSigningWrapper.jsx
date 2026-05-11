import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ContractSigningWrapper = ({ userRole }) => {
  const navigate = useNavigate();
  const { contractId, extensionId } = useParams();

  useEffect(() => {
    if (extensionId) {
      navigate(userRole === 'OWNER' ? '/contract-extensions' : '/contract-extensions-renter', { replace: true });
      return;
    }
    if (contractId) {
      navigate(`/contracts/${contractId}?tab=signing`, { replace: true });
      return;
    }
    navigate('/my-contracts', { replace: true });
  }, [contractId, extensionId, navigate, userRole]);

  return null;
};

export default ContractSigningWrapper;
