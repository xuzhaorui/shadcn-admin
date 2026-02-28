import { useMemo } from 'react'
import { Activity, Database, Eraser, Layers3, ListFilter, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePermission } from '@/hooks/use-permission'
import {
  useCacheSummary,
  useClearAllCache,
  useClearCache,
} from './hooks/use-cache-monitor'

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(2)} MB`
}

const formatRate = (value: number) => `${value.toFixed(2)}%`

const formatTtl = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}

export function CacheMonitor() {
  const { can } = usePermission()
  const canClear = can('monitor:cache:clear')

  const { data, isLoading, isFetching, isError, refetch } = useCacheSummary()
  const clearCache = useClearCache()
  const clearAll = useClearAllCache()
  const isBusy = isLoading || isFetching

  const avgHitRate = useMemo(() => {
    if (!data?.caches?.length) return 0
    const total = data.caches.reduce((acc, item) => acc + item.hitRate, 0)
    return total / data.caches.length
  }, [data])

  const handleClearCache = async (cacheName: string) => {
    if (!canClear) return
    await clearCache.mutateAsync(cacheName)
    toast.success(`缓存 ${cacheName} 已清空`)
  }

  const handleClearAll = async () => {
    if (!canClear) return
    const message = await clearAll.mutateAsync()
    toast.success(message || '全部缓存已清空')
  }

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
            <h2 className='text-2xl font-bold tracking-tight'>缓存监控</h2>
            <p className='text-muted-foreground'>本地 Caffeine 缓存实时状态。</p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => void refetch()} disabled={isBusy}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            {canClear ? (
              <Button
                variant='destructive'
                onClick={() => void handleClearAll()}
                disabled={clearAll.isPending}
              >
                <Eraser className='mr-2 h-4 w-4' />
                全部清空
              </Button>
            ) : null}
          </div>
        </div>

        {isError ? (
          <Card>
            <CardContent className='py-6 text-sm text-destructive'>
              缓存指标加载失败，请稍后重试。
            </CardContent>
          </Card>
        ) : null}

        <div className='grid gap-4 md:grid-cols-4'>
          <Card className='border-primary/30 bg-primary/5'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>缓存数量</CardTitle>
              <Layers3 className='h-4 w-4 text-primary' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{data?.cacheCount ?? 0}</div>
              <p className='text-xs text-muted-foreground'>已注册缓存实例</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>键数量</CardTitle>
              <Database className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{data?.totalEntries ?? 0}</div>
              <p className='text-xs text-muted-foreground'>当前活跃键总数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>估算内存</CardTitle>
              <Activity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{formatBytes(data?.totalEstimatedBytes ?? 0)}</div>
              <p className='text-xs text-muted-foreground'>近似数据体积</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>平均命中率</CardTitle>
              <ListFilter className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{formatRate(avgHitRate)}</div>
              <Progress value={avgHitRate} className='mt-2' />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>缓存池</CardTitle>
            <CardDescription>
              采样时间：{data?.sampledAt ? new Date(data.sampledAt).toLocaleString('zh-CN') : '--'}
            </CardDescription>
          </CardHeader>
          <CardContent className='overflow-hidden rounded-md border p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>缓存名称</TableHead>
                  <TableHead>键数量</TableHead>
                  <TableHead>TTL</TableHead>
                  <TableHead>命中率</TableHead>
                  <TableHead>请求</TableHead>
                  <TableHead>内存</TableHead>
                  <TableHead className='w-[120px]'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.caches?.length ? (
                  data.caches.map((cache) => (
                    <TableRow key={cache.cacheName}>
                      <TableCell className='font-medium'>{cache.cacheName}</TableCell>
                      <TableCell>
                        <Badge variant='secondary'>
                          {cache.entryCount}/{cache.maxSize}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatTtl(cache.ttlSeconds)}</TableCell>
                      <TableCell className='w-[220px]'>
                        <div className='space-y-1'>
                          <div className='text-xs text-muted-foreground'>{formatRate(cache.hitRate)}</div>
                          <Progress value={cache.hitRate} className='h-2' />
                        </div>
                      </TableCell>
                      <TableCell className='text-xs text-muted-foreground'>
                        命中 {cache.hitCount} / 未命中 {cache.missCount}
                      </TableCell>
                      <TableCell>{formatBytes(cache.estimatedBytes)}</TableCell>
                      <TableCell>
                        {canClear ? (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive'
                            onClick={() => void handleClearCache(cache.cacheName)}
                            disabled={clearCache.isPending}
                          >
                            清空
                          </Button>
                        ) : (
                          <span className='text-xs text-muted-foreground'>-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className='h-24 text-center text-muted-foreground'>
                      {isBusy ? '加载中...' : '暂无缓存数据'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
