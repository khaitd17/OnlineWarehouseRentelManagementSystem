import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout,
  Row,
  Col,
  Typography,
  Button,
  Input,
  Select,
  Card,
  Spin,
  Empty,
  message,
  Space,
  Badge,
  Tabs
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  ContainerOutlined,
  ClockCircleOutlined,
  FilterOutlined
} from '@ant-design/icons';
import ContractCard from '../components/contract/ContractCard';
import ExtensionRequestModal from '../components/contract/ExtensionRequestModal';
import contractExtensionService from '../services/contractExtensionService';
import {
  Contract,
  ContractExtension
} from '../types/contractExtension';

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;
const { TabPane } = Tabs;

// Mock API calls - replace with actual API calls
const contractService = {
  getMyContracts: async (): Promise<Contract[]> => {
    // Mock implementation - replace with actual API call
    return [];
  }
};

const RenterExtensionPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [extensions, setExtensions] = useState<ContractExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState('contracts');

  // Load data
  const loadData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [contractsData, extensionsData] = await Promise.all([
        contractService.getMyContracts(),
        contractExtensionService.getMyExtensions()
      ]);

      setContracts(contractsData);
      setExtensions(extensionsData);
    } catch (error: any) {
      message.error('Kh├┤ng thß╗â tß║úi dß╗» liß╗çu: ' + (error.message || 'Lß╗ùi kh├┤ng x├íc ─æß╗ïnh'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    if (searchTerm && !contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !contract.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter && contract.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Handle extension request
  const handleExtensionRequest = useCallback((contract: Contract) => {
    const eligibility = contractExtensionService.checkExtensionEligibility(contract);
    if (!eligibility.eligible) {
      message.warning(eligibility.reason!);
      return;
    }
    setSelectedContract(contract);
  }, []);

  const handleExtensionSuccess = useCallback(() => {
    loadData(true);
    message.success('Y├¬u cß║ºu gia hß║ín ─æ├ú ─æ╞░ß╗úc gß╗¡i th├ánh c├┤ng!');
  }, [loadData]);

  // Get pending extensions count
  const pendingExtensionsCount = extensions.filter(ext => ext.status === 'PENDING').length;

  // Get contracts needing attention
  const contractsNeedingAttention = contracts.filter(contract => {
    if (contract.status !== 'ACTIVE') return false;
    const endDate = new Date(contract.endDate);
    const today = new Date();
    const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilEnd <= 30 && daysUntilEnd >= 0;
  }).length;

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: '0 0 8px 0', color: '#0f172a' }}>
                <ContainerOutlined /> Quß║ún l├╜ hß╗úp ─æß╗ông
              </Title>
              <Text type="secondary">Quß║ún l├╜ hß╗úp ─æß╗ông thu├¬ kho v├á y├¬u cß║ºu gia hß║ín</Text>
            </Col>
            <Col>
              <Space>
                <Badge count={contractsNeedingAttention} showZero={false}>
                  <Card size="small" style={{ textAlign: 'center', minWidth: '80px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Sß║»p hß║┐t hß║ín</Text>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16' }}>
                      {contractsNeedingAttention}
                    </div>
                  </Card>
                </Badge>
                <Badge count={pendingExtensionsCount} showZero={false}>
                  <Card size="small" style={{ textAlign: 'center', minWidth: '80px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Chß╗¥ duyß╗çt</Text>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1677ff' }}>
                      {pendingExtensionsCount}
                    </div>
                  </Card>
                </Badge>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          tabBarStyle={{ padding: '0 20px', margin: 0 }}
        >
          {/* Contracts Tab */}
          <TabPane
            tab={
              <Space>
                <ContainerOutlined />
                <span>Hß╗úp ─æß╗ông cß╗ºa t├┤i</span>
                <Badge count={contracts.length} showZero style={{ backgroundColor: '#108ee9' }} />
              </Space>
            }
            key="contracts"
          >
            <div style={{ padding: '0 20px 20px' }}>
              {/* Filters */}
              <Row gutter={16} style={{ marginBottom: 20 }}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Input
                    placeholder="T├¼m kiß║┐m theo m├ú hß╗úp ─æß╗ông hoß║╖c t├¬n kho"
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    allowClear
                  />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Select
                    placeholder="Lß╗ìc theo trß║íng th├íi"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    allowClear
                    style={{ width: '100%' }}
                    suffixIcon={<FilterOutlined />}
                  >
                    <Option value="ACTIVE">─Éang hoß║ít ─æß╗Öng</Option>
                    <Option value="PENDING_OWNER_SIGNATURE">Chß╗¥ chß╗º kho k├╜</Option>
                    <Option value="PENDING_RENTER_SIGNATURE">Chß╗¥ ng╞░ß╗¥i thu├¬ k├╜</Option>
                    <Option value="PENDING_PAYMENT">Chß╗¥ thanh to├ín</Option>
                    <Option value="CANCELLED">─É├ú hß╗ºy</Option>
                    <Option value="EXPIRED">Hß║┐t hß║ín</Option>
                  </Select>
                </Col>
                <Col flex="auto" style={{ textAlign: 'right' }}>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => loadData(true)}
                    loading={refreshing}
                  >
                    L├ám mß╗¢i
                  </Button>
                </Col>
              </Row>

              {/* Contract Cards */}
              {filteredContracts.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Kh├┤ng t├¼m thß║Ñy hß╗úp ─æß╗ông n├áo"
                />
              ) : (
                <Row gutter={[16, 16]}>
                  {filteredContracts.map((contract) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={contract.contractId}>
                      <ContractCard
                        contract={contract}
                        onRequestExtension={handleExtensionRequest}
                        showExtensionButton={contract.status === 'ACTIVE'}
                      />
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          </TabPane>

          {/* Extensions Tab */}
          <TabPane
            tab={
              <Space>
                <ClockCircleOutlined />
                <span>Y├¬u cß║ºu gia hß║ín</span>
                <Badge count={extensions.length} showZero style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            key="extensions"
          >
            <div style={{ padding: '0 20px 20px' }}>
              {extensions.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Ch╞░a c├│ y├¬u cß║ºu gia hß║ín n├áo"
                />
              ) : (
                <Row gutter={[16, 16]}>
                  {extensions.map((extension) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={extension.extensionId}>
                      <Card
                        title={`Gia hß║ín ${extension.originalContract?.contractNumber || 'N/A'}`}
                        extra={
                          <Badge
                            status={
                              extension.status === 'APPROVED' ? 'success' :
                              extension.status === 'REJECTED' ? 'error' :
                              extension.status === 'CANCELLED' ? 'default' : 'processing'
                            }
                            text={contractExtensionService.getStatusDisplay(extension.status).text}
                          />
                        }
                      >
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <div>
                            <Text type="secondary">Thß╗¥i gian:</Text>
                            <Text style={{ float: 'right' }}>
                              {contractExtensionService.formatDuration(extension.durationMonths)}
                            </Text>
                          </div>
                          <div>
                            <Text type="secondary">Ng├áy y├¬u cß║ºu:</Text>
                            <Text style={{ float: 'right' }}>
                              {contractExtensionService.formatDate(extension.requestedAt)}
                            </Text>
                          </div>
                          {extension.reviewedAt && (
                            <div>
                              <Text type="secondary">Ng├áy duyß╗çt:</Text>
                              <Text style={{ float: 'right' }}>
                                {contractExtensionService.formatDate(extension.reviewedAt)}
                              </Text>
                            </div>
                          )}
                          {extension.reviewNotes && (
                            <div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Ghi ch├║: {extension.reviewNotes}
                              </Text>
                            </div>
                          )}
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          </TabPane>
        </Tabs>

        {/* Extension Request Modal */}
        {selectedContract && (
          <ExtensionRequestModal
            contract={selectedContract}
            onClose={() => setSelectedContract(null)}
            onSuccess={handleExtensionSuccess}
          />
        )}
      </Content>
    </Layout>
  );
};

export default RenterExtensionPage;
