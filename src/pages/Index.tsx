import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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

interface Record {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: 'active',
  });
  const { toast } = useToast();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`${API_URL}?${params}`);
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить записи',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [searchQuery]);

  const handleOpenDialog = (record?: Record) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        title: record.title,
        description: record.description,
        category: record.category,
        status: record.status,
      });
    } else {
      setEditingRecord(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        status: 'active',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Название обязательно',
        variant: 'destructive',
      });
      return;
    }

    try {
      const method = editingRecord ? 'PUT' : 'POST';
      const url = editingRecord
        ? `${API_URL}/${editingRecord.id}`
        : API_URL;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: editingRecord
            ? 'Запись обновлена'
            : 'Запись создана',
        });
        setIsDialogOpen(false);
        fetchRecords();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить запись',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту запись?')) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Запись удалена',
        });
        fetchRecords();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить запись',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-foreground">
              База данных
            </h1>
            <p className="text-muted-foreground mt-2">
              Управление записями PostgreSQL
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            size="lg"
            className="gap-2"
          >
            <Icon name="Plus" size={18} />
            Создать
          </Button>
        </div>

        <Card className="border-border/50 shadow-sm">
          <div className="p-6">
            <div className="relative">
              <Icon
                name="Search"
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Поиск по названию или описанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-border/50"
              />
            </div>
          </div>

          <div className="border-t border-border/50">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">
                <Icon name="Loader2" size={32} className="mx-auto animate-spin mb-3" />
                Загрузка...
              </div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Icon name="Database" size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-lg">Записей не найдено</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-medium">Название</TableHead>
                    <TableHead className="font-medium">Описание</TableHead>
                    <TableHead className="font-medium">Категория</TableHead>
                    <TableHead className="font-medium">Статус</TableHead>
                    <TableHead className="text-right font-medium">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow
                      key={record.id}
                      className="border-border/50 hover:bg-accent/50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        {record.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-md truncate">
                        {record.description}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                          {record.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            record.status === 'active'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {record.status === 'active' ? 'Активна' : 'Завершена'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(record)}
                            className="h-8 w-8 p-0"
                          >
                            <Icon name="Pencil" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
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
            )}
          </div>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">
              {editingRecord ? 'Редактировать' : 'Создать запись'}
            </DialogTitle>
            <DialogDescription>
              {editingRecord
                ? 'Обновите информацию о записи'
                : 'Добавьте новую запись в базу данных'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Введите название"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Добавьте описание"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="Укажите категорию"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активна</SelectItem>
                  <SelectItem value="completed">Завершена</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
              >
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
