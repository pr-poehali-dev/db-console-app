import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/17506c36-0d59-467f-9d55-8509d4f6ad75';

interface Material {
  id: number;
  name: string;
  unit: string;
  price_per_unit: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

interface Operation {
  id: number;
  name: string;
  description: string;
  cost: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: number;
  customer_name: string;
  description: string;
  status: string;
  total_cost: number;
  deadline: string;
  created_at: string;
  updated_at: string;
}

type TableType = 'materials' | 'operations' | 'orders';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TableType>('materials');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();

  const fetchData = async (table: TableType) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${API_URL}?${params}`, {
        headers: { 'X-Table-Name': table },
      });
      const data = await response.json();

      if (table === 'materials') setMaterials(data);
      else if (table === 'operations') setOperations(data);
      else setOrders(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, searchQuery]);

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({ ...item });
    } else {
      setEditingItem(null);
      if (activeTab === 'materials') {
        setFormData({ name: '', unit: '', price_per_unit: 0, stock_quantity: 0 });
      } else if (activeTab === 'operations') {
        setFormData({ name: '', description: '', cost: 0, duration_minutes: 0 });
      } else {
        setFormData({ customer_name: '', description: '', status: 'pending', total_cost: 0, deadline: '' });
      }
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `${API_URL}/${editingItem.id}` : API_URL;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Table-Name': activeTab,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: editingItem ? 'Обновлено' : 'Создано',
        });
        setIsDialogOpen(false);
        fetchData(activeTab);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту запись?')) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'X-Table-Name': activeTab },
      });

      if (response.ok) {
        toast({ title: 'Успешно', description: 'Удалено' });
        fetchData(activeTab);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить',
        variant: 'destructive',
      });
    }
  };

  const renderTable = () => {
    const data = activeTab === 'materials' ? materials : activeTab === 'operations' ? operations : orders;

    if (loading) {
      return (
        <div className="p-12 text-center text-muted-foreground">
          <Icon name="Loader2" size={32} className="mx-auto animate-spin mb-3" />
          Загрузка...
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="p-12 text-center text-muted-foreground">
          <Icon name="Database" size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-lg">Записей не найдено</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            {activeTab === 'materials' && (
              <>
                <TableHead className="font-medium">Название</TableHead>
                <TableHead className="font-medium">Единица</TableHead>
                <TableHead className="font-medium">Цена за ед.</TableHead>
                <TableHead className="font-medium">Остаток</TableHead>
                <TableHead className="text-right font-medium">Действия</TableHead>
              </>
            )}
            {activeTab === 'operations' && (
              <>
                <TableHead className="font-medium">Название</TableHead>
                <TableHead className="font-medium">Описание</TableHead>
                <TableHead className="font-medium">Стоимость</TableHead>
                <TableHead className="font-medium">Длительность (мин)</TableHead>
                <TableHead className="text-right font-medium">Действия</TableHead>
              </>
            )}
            {activeTab === 'orders' && (
              <>
                <TableHead className="font-medium">Клиент</TableHead>
                <TableHead className="font-medium">Описание</TableHead>
                <TableHead className="font-medium">Статус</TableHead>
                <TableHead className="font-medium">Сумма</TableHead>
                <TableHead className="font-medium">Срок</TableHead>
                <TableHead className="text-right font-medium">Действия</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item: any) => (
            <TableRow key={item.id} className="border-border/50 hover:bg-accent/50 transition-colors">
              {activeTab === 'materials' && (
                <>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.price_per_unit} ₽</TableCell>
                  <TableCell>{item.stock_quantity}</TableCell>
                </>
              )}
              {activeTab === 'operations' && (
                <>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">{item.description}</TableCell>
                  <TableCell>{item.cost} ₽</TableCell>
                  <TableCell>{item.duration_minutes}</TableCell>
                </>
              )}
              {activeTab === 'orders' && (
                <>
                  <TableCell className="font-medium">{item.customer_name}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">{item.description}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        item.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : item.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.status === 'pending' ? 'Ожидание' : item.status === 'in_progress' ? 'В работе' : 'Завершён'}
                    </span>
                  </TableCell>
                  <TableCell>{item.total_cost} ₽</TableCell>
                  <TableCell>{item.deadline ? new Date(item.deadline).toLocaleDateString('ru-RU') : '—'}</TableCell>
                </>
              )}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(item)} className="h-8 w-8 p-0">
                    <Icon name="Pencil" size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Icon name="Trash2" size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderForm = () => {
    if (activeTab === 'materials') {
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Введите название материала"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Единица измерения *</Label>
            <Input
              id="unit"
              value={formData.unit || ''}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="кг, л, шт"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Цена за единицу</Label>
              <Input
                id="price"
                type="number"
                value={formData.price_per_unit || 0}
                onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Остаток</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity || 0}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </>
      );
    }

    if (activeTab === 'operations') {
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Введите название операции"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Добавьте описание"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Стоимость</Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost || 0}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Длительность (мин)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes || 0}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="customer">Клиент *</Label>
          <Input
            id="customer"
            value={formData.customer_name || ''}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            placeholder="Введите имя клиента"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Описание заказа"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select value={formData.status || 'pending'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Ожидание</SelectItem>
                <SelectItem value="in_progress">В работе</SelectItem>
                <SelectItem value="completed">Завершён</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="total">Сумма</Label>
            <Input
              id="total"
              type="number"
              value={formData.total_cost || 0}
              onChange={(e) => setFormData({ ...formData, total_cost: parseFloat(e.target.value) })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Срок выполнения</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline || ''}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-foreground">База данных</h1>
            <p className="text-muted-foreground mt-2">Управление производственными данными</p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="lg" className="gap-2">
            <Icon name="Plus" size={18} />
            Создать
          </Button>
        </div>

        <Card className="border-border/50 shadow-sm">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TableType)} className="w-full">
            <div className="border-b border-border/50 px-6">
              <TabsList className="bg-transparent h-14">
                <TabsTrigger value="materials" className="gap-2">
                  <Icon name="Package" size={18} />
                  Материалы
                </TabsTrigger>
                <TabsTrigger value="operations" className="gap-2">
                  <Icon name="Settings" size={18} />
                  Операции
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2">
                  <Icon name="ShoppingCart" size={18} />
                  Заказы
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <div className="relative">
                <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-border/50"
                />
              </div>
            </div>

            <TabsContent value="materials" className="m-0 border-t border-border/50">
              {renderTable()}
            </TabsContent>
            <TabsContent value="operations" className="m-0 border-t border-border/50">
              {renderTable()}
            </TabsContent>
            <TabsContent value="orders" className="m-0 border-t border-border/50">
              {renderTable()}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">
              {editingItem ? 'Редактировать' : 'Создать'}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'materials' && 'Информация о материале'}
              {activeTab === 'operations' && 'Информация об операции'}
              {activeTab === 'orders' && 'Информация о заказе'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {renderForm()}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Icon name="Save" size={16} />
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
