import { Cpu, HardDrive, MemoryStick, RefreshCw } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useServerMetrics } from './hooks/use-server-metrics'

const formatNum = (value?: number, digits = 2) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--'
  return value.toFixed(digits)
}

export function ServerMonitor() {
  const { data, isLoading, isFetching, isError, refetch } = useServerMetrics()
  const serverInfo = data
  const isBusy = isLoading || isFetching

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>服务器监控</h2>
            <p className='text-muted-foreground'>
              实时监控服务器性能指标
            </p>
          </div>
          <Button variant='outline' onClick={() => void refetch()} disabled={isBusy}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        {isError ? (
          <Card>
            <CardContent className='py-6 text-sm text-destructive'>
              服务器监控数据获取失败，请稍后重试。
            </CardContent>
          </Card>
        ) : null}

        <div className='grid gap-4 md:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>CPU 使用率</CardTitle>
              <Cpu className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{formatNum(serverInfo?.cpu.usage)}%</div>
              <Progress value={serverInfo?.cpu.usage ?? 0} className='mt-2' />
              <p className='mt-2 text-xs text-muted-foreground'>
                {serverInfo?.cpu.cores ?? '--'} 核心
                {' · '}
                {serverInfo?.cpu.speedGhz ? `${formatNum(serverInfo.cpu.speedGhz)} GHz` : '频率未知'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>内存使用率</CardTitle>
              <MemoryStick className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{formatNum(serverInfo?.memory.usage)}%</div>
              <Progress value={serverInfo?.memory.usage ?? 0} className='mt-2' />
              <p className='mt-2 text-xs text-muted-foreground'>
                {formatNum(serverInfo?.memory.usedGb)} GB / {formatNum(serverInfo?.memory.totalGb)} GB
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>磁盘使用率</CardTitle>
              <HardDrive className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{formatNum(serverInfo?.disk.usage)}%</div>
              <Progress value={serverInfo?.disk.usage ?? 0} className='mt-2' />
              <p className='mt-2 text-xs text-muted-foreground'>
                {formatNum(serverInfo?.disk.usedGb)} GB / {formatNum(serverInfo?.disk.totalGb)} GB
              </p>
            </CardContent>
          </Card>
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>系统信息</CardTitle>
              <CardDescription>服务器操作系统详情</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className='space-y-3'>
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>操作系统</dt>
                  <dd className='font-medium'>{serverInfo?.system.os ?? '--'}</dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>主机名</dt>
                  <dd className='font-medium'>{serverInfo?.system.hostname ?? '--'}</dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>系统架构</dt>
                  <dd className='font-medium'>{serverInfo?.system.arch ?? '--'}</dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>运行时长</dt>
                  <dd className='font-medium'>{serverInfo?.system.uptime ?? '--'}</dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>CPU型号</dt>
                  <dd className='font-medium'>{serverInfo?.cpu.model ?? '--'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JVM信息</CardTitle>
              <CardDescription>Java虚拟机运行状态</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className='space-y-3'>
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>JVM版本</dt>
                  <dd className='font-medium'>{serverInfo?.jvm.version ?? '--'}</dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>供应商</dt>
                  <dd className='font-medium'>{serverInfo?.jvm.vendor ?? '--'}</dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>已用堆内存</dt>
                  <dd className='font-medium'>{formatNum(serverInfo?.jvm.heapUsedMb)} MB</dd>
                </div>
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>最大堆内存</dt>
                  <dd className='font-medium'>{formatNum(serverInfo?.jvm.heapMaxMb)} MB</dd>
                </div>
                <div className='flex flex-col gap-1'>
                  <div className='flex justify-between'>
                    <dt className='text-muted-foreground'>堆内存使用率</dt>
                    <dd className='font-medium'>{formatNum(serverInfo?.jvm.heapUsage)}%</dd>
                  </div>
                  <Progress value={serverInfo?.jvm.heapUsage ?? 0} />
                </div>
                <div className='flex justify-between'>
                  <dt className='text-muted-foreground'>采样时间</dt>
                  <dd className='font-medium text-xs text-muted-foreground'>
                    {serverInfo?.sampledAt ? new Date(serverInfo.sampledAt).toLocaleString('zh-CN') : '--'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
