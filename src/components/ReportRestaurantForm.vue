<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const isOpen = ref(false);
const restaurantName = ref("");
const reportReason = ref("");

function submitReport() {
  console.log(
    "Reporting restaurant:",
    restaurantName.value,
    "Reason:",
    reportReason.value
  );
  isOpen.value = false;
  restaurantName.value = "";
  reportReason.value = "";
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="outline">Report Restaurant</Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Report Restaurant</DialogTitle>
        <DialogDescription>
          Fill in the details to report a restaurant.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="restaurantName" class="text-right">
            Restaurant Name
          </Label>
          <Input
            id="restaurantName"
            v-model="restaurantName"
            class="col-span-3"
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="reportReason" class="text-right"> Reason </Label>
          <Textarea
            id="reportReason"
            v-model="reportReason"
            class="col-span-3"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" @click="submitReport"> Submit Report </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
