import { faRefresh, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Divider, Drawer, Empty, Space, Typography } from 'antd';
import { generatePath, useNavigate, useParams } from 'react-router-dom';

import { paths } from '@ui/config/paths';
import { HealthStatusIcon } from '@ui/features/common/health-status-icon/health-status-icon';
import { AvailableFreight } from '@ui/features/stage/available-freight';
import { Subscriptions } from '@ui/features/stage/subscriptions';
import {
  deleteStage,
  getStage,
  refreshStage
} from '@ui/gen/service/v1alpha1/service-KargoService_connectquery';

import { ButtonIcon, LoadingState } from '../common';
import { useConfirmModal } from '../common/confirm-modal/use-confirm-modal';

export const StageDetails = () => {
  const { name: projectName, stageName } = useParams();
  const confirm = useConfirmModal();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    ...getStage.useQuery({ project: projectName, name: stageName }),
    enabled: !!stageName
  });

  const onClose = () => navigate(generatePath(paths.project, { name: projectName }));

  const { mutate, isLoading: isLoadingDelete } = useMutation(deleteStage.useMutation());
  const { mutate: refresh, isLoading: isRefreshLoading } = useMutation(refreshStage.useMutation());

  const onDelete = () => {
    confirm({
      onOk: () => {
        mutate({ name: data?.stage?.metadata?.name, project: projectName });
        onClose();
      },
      title: 'Are you sure you want to delete Stage?'
    });
  };

  const onRefresh = () => refresh({ name: stageName, project: projectName });

  return (
    <Drawer open={!!stageName} onClose={onClose} width={'80%'} closable={false}>
      {isLoading && <LoadingState />}
      {!isLoading && !data?.stage && <Empty description='Stage not found' />}
      {data?.stage && (
        <>
          <div className='flex items-center justify-between'>
            <div className='flex gap-1 items-start'>
              <HealthStatusIcon
                health={data.stage.status?.currentFreight?.health}
                style={{ marginRight: '10px', marginTop: '10px' }}
              />
              <div>
                <Typography.Title level={1} style={{ margin: 0 }}>
                  {data.stage.metadata?.name}
                </Typography.Title>
                <Typography.Text type='secondary'>{projectName}</Typography.Text>
              </div>
            </div>
            <Space size={16}>
              <Button
                type='default'
                icon={<ButtonIcon icon={faRefresh} size='1x' />}
                onClick={onRefresh}
                loading={
                  isRefreshLoading || !!data.stage.metadata?.annotations['kargo.akuity.io/refresh']
                }
              >
                Refresh
              </Button>
              <Button
                danger
                type='text'
                icon={<ButtonIcon icon={faTrash} size='1x' />}
                onClick={onDelete}
                loading={isLoadingDelete}
                size='small'
              >
                Delete
              </Button>
            </Space>
          </div>
          <Divider style={{ marginTop: '1em' }} />

          <div className='flex flex-col gap-8'>
            <Subscriptions
              subscriptions={data.stage.spec?.subscriptions}
              projectName={projectName}
            />
            <AvailableFreight stage={data.stage} onSuccess={refetch} />
          </div>
        </>
      )}
    </Drawer>
  );
};
