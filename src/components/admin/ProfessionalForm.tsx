import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershop } from "@/hooks/useBarbershop";
import { Plus } from "lucide-react";

interface ProfessionalFormProps {
  onSuccess: () => void;
}

const ProfessionalForm = ({ onSuccess }: ProfessionalFormProps) => {
  const { barbershop } = useBarbershop();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [rating, setRating] = useState("5.0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barbershop) {
      toast.error("Barbearia não encontrada");
      return;
    }

    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      const specialtiesArray = specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const { error } = await supabase.from("professionals").insert({
        barbershop_id: barbershop.id,
        name: name.trim(),
        bio: bio.trim() || null,
        specialties: specialtiesArray.length > 0 ? specialtiesArray : null,
        rating: parseFloat(rating),
        is_active: true,
      });

      if (error) throw error;

      toast.success("Profissional cadastrado com sucesso!");
      
      // Limpar formulário
      setName("");
      setBio("");
      setSpecialties("");
      setRating("5.0");
      
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao cadastrar profissional:", error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Cadastrar Novo Profissional
        </CardTitle>
        <CardDescription>
          Adicione um novo barbeiro à sua equipe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prof-name">Nome *</Label>
            <Input
              id="prof-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do profissional"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof-bio">Biografia</Label>
            <Textarea
              id="prof-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Breve descrição sobre o profissional..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof-specialties">Especialidades</Label>
            <Input
              id="prof-specialties"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="Ex: Barba, Corte Moderno, Degradê (separado por vírgula)"
            />
            <p className="text-xs text-muted-foreground">
              Separe as especialidades por vírgula
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof-rating">Avaliação Inicial</Label>
            <Input
              id="prof-rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="imperial"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cadastrando..." : "Cadastrar Profissional"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfessionalForm;
