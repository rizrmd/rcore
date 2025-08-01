import { GlobalLoading } from "@/components/esensi/ui/global-loading";
import { MainEsensiLayout, current } from "@/components/esensi/layout/layout";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComboBox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/gen/main.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { useForm } from "react-hook-form";
import React, { useEffect } from "react";

// Data Imports
import provincesData from "@/data/provinces.json";
import { loadCitiesByProvince } from "@/data/cities-loader";
import { loadDistrictsByCity } from "@/data/districts-loader";
import { loadVillagesByDistrict } from "@/data/villages-loader";


// --- 1. TYPE DEFINITIONS ---
type DbAddress = {
  id: string;
  address: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postal_code: string;
  is_primary: boolean;
  notes: string | null;
  fullname?: string;
  phone?: string;
};

interface AddressFormData {
  fullName: string;
  phoneNumber: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
  streetDetail: string;
  notes?: string;
  is_default?: boolean;
}

interface AddressPageData {
  title: string;
  addresses: DbAddress[];
  user?: any;
}


export default (data: AddressPageData) => {
  const header_config = { enable: true, logo: false, back: true, search: false, title: "Buku Alamat", cart: true, profile: true };

  const local = useLocal({
    isLoading: true,
    saving: false,
    addresses: [] as DbAddress[],
    editingAddress: null as DbAddress | null,
    // State for dropdown options
    cities: [] as { id: string, name: string }[],
    districts: [] as { id: string, name: string }[],
    villages: [] as { id: string, name: string }[],
    // State for loading indicators
    loadingCities: false,
    loadingDistricts: false,
    loadingVillages: false,
  });

  const form = useForm<AddressFormData>();

  useEffect(() => {
    if (data.addresses) {
      local.addresses = data.addresses.map(addr => ({
        ...addr,
        fullname: data.user?.name || '',
        phone: data.user?.customer?.whatsapp || '',
      }));
      local.isLoading = false;
      local.render();
    }
  }, [data.addresses]);

  const setupForm = async (address: DbAddress | null) => {
    local.editingAddress = address;
    form.reset();
    local.cities = [];
    local.districts = [];
    local.villages = [];

    if (address) {
        if (address.province) {
            local.loadingCities = true;
            local.render();
            const cityList = await loadCitiesByProvince(address.province);
            local.cities = cityList;
            local.loadingCities = false;
        }

        if (address.city) {
            local.loadingDistricts = true;
            local.render();
            const districtList = await loadDistrictsByCity(address.city);
            local.districts = districtList;
            local.loadingDistricts = false;
        }

        if (address.district) {
            local.loadingVillages = true;
            local.render();
            const villageList = await loadVillagesByDistrict(address.district);
            local.villages = villageList;
            local.loadingVillages = false;
        }

        form.reset({
            fullName: address.fullname || '',
            phoneNumber: address.phone || '',
            province: address.province || '',
            city: address.city || '',
            district: address.district || '',
            village: address.village || '',
            postalCode: address.postal_code || '',
            streetDetail: address.address?.split(',')[0] || '',
            notes: address.notes || '',
            is_default: address.is_primary || false,
        });

    } else {
        form.reset({
            fullName: data.user?.name || "",
            phoneNumber: data.user?.customer?.whatsapp || "",
            province: "", city: "", district: "", village: "", postalCode: "", streetDetail: "", notes: "",
            is_default: false,
        });
    }
    local.render();
  };

 const onSubmit = async (formData: AddressFormData) => {
    local.saving = true;
    local.render();

    try {
      // Step 1: Get location names from data for the search query
      const provinceName = provincesData.find(p => p.id === formData.province)?.name ?? formData.province;
      const cityName = local.cities.find(c => c.id === formData.city)?.name ?? formData.city;
      const districtName = local.districts.find(d => d.id === formData.district)?.name ?? formData.district;
      const villageName = local.villages.find(v => v.id === formData.village)?.name ?? formData.village;
      
      // Step 2: Construct the search query string from form data
      const searchQuery = [villageName, districtName, cityName, provinceName, formData.postalCode].filter(Boolean).join(', ');

      if (searchQuery.length < 3) {
        alert("Harap isi alamat dengan lengkap untuk verifikasi lokasi.");
        local.saving = false;
        local.render();
        return;
      }

      // Step 3: Call the search API to get the verified subdistrict ID
      const searchResult = await api.search_subdistrict({ search: searchQuery });

      if (!searchResult.success || !searchResult.data?.subdistrict_id) {
        alert(searchResult.message || "Gagal memverifikasi lokasi. Pastikan alamat Anda benar.");
        local.saving = false;
        local.render();
        return; // Stop the submission if search fails
      }

      const verifiedSubdistrictId = searchResult.data.subdistrict_id;

      // Step 4: Construct the payload for the save_address API
      const fullAddress = [formData.streetDetail, villageName, districtName, cityName, provinceName, formData.postalCode].filter(Boolean).join(', ');

      const payload = {
        id: local.editingAddress?.id,
        fullname: formData.fullName,
        phone: formData.phoneNumber,
        country: "ID",
        province: formData.province,
        city: formData.city,
        district: formData.district,
        village: formData.village,
        postal_code: formData.postalCode,
        streets: formData.streetDetail,
        address: fullAddress,
        notes: formData.notes,
        is_default: formData.is_default,
        // Include the verified ID from the search
        id_subdistrict: verifiedSubdistrictId, 
      };
      
      // Step 5: Call the save_address API with the complete payload
      const result = await api.save_address(payload);

      if (result.success) {
        alert("Alamat berhasil disimpan!");
        window.location.reload();
      } else {
        let errorMessage = result.message || "Gagal menyimpan alamat.";
        if (result.error && result.error.fieldErrors) {
          const fieldErrors = Object.entries(result.error.fieldErrors)
            .map(([field, messages]) => `- ${field}: ${(messages as string[]).join(', ')}`)
            .join('\n');
          errorMessage += `\n\nDetail Kesalahan:\n${fieldErrors}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Gagal menyimpan alamat.");
    } finally {
      local.saving = false;
      local.render();
    }
  };

  // --- UPDATED: Function uses window.confirm for deletion ---
  const handleDeleteAddress = async (addressId: string) => {
    // Use the default browser confirmation dialog
    const confirmed = window.confirm("Anda yakin ingin menghapus alamat ini?");
    
    // Stop the function if the user clicks "Cancel"
    if (!confirmed) {
      return;
    }

    local.saving = true;
    local.render();
    try {
        const result = await api.delete_address({ id: addressId });
        if (result.success) {
            alert(result.message || "Alamat berhasil dihapus!");
            window.location.reload(); // Reload to see the changes
        } else {
            alert(result.message || "Gagal menghapus alamat.");
        }
    } catch (error) {
        console.error("Error deleting address:", error);
        let detailedMessage = "Terjadi kesalahan saat menghapus alamat.";
        if (error instanceof SyntaxError) {
            detailedMessage += "\n\nError: Server mengembalikan respons yang tidak valid. Ini mungkin karena API endpoint tidak ditemukan (404) atau terjadi error di server.";
        }
        alert(detailedMessage);
    } finally {
        local.saving = false;
        local.render();
    }
  };

  const handleProvinceChange = async (provinceId: string) => {
    form.setValue('province', provinceId);
    form.setValue('city', '');
    form.setValue('district', '');
    form.setValue('village', '');
    local.cities = [];
    local.districts = [];
    local.villages = [];

    if (provinceId) {
        local.loadingCities = true;
        local.render();
        const cityList = await loadCitiesByProvince(provinceId);
        local.cities = cityList;
        local.loadingCities = false;
        local.render();
    }
  };

  const handleCityChange = async (cityId: string) => {
    form.setValue('city', cityId);
    form.setValue('district', '');
    form.setValue('village', '');
    local.districts = [];
    local.villages = [];

    if (cityId) {
        local.loadingDistricts = true;
        local.render();
        const districtList = await loadDistrictsByCity(cityId);
        local.districts = districtList;
        local.loadingDistricts = false;
        local.render();
    }
  };

  const handleDistrictChange = async (districtId: string) => {
    form.setValue('district', districtId);
    form.setValue('village', '');
    local.villages = [];

    if (districtId) {
        local.loadingVillages = true;
        local.render();
        const villageList = await loadVillagesByDistrict(districtId);
        local.villages = villageList;
        local.loadingVillages = false;
        local.render();
    }
  };

  const renderAddressList = () => (
    <div className="w-full mb-12">
      <h2 className="text-xl font-semibold text-[#3B2C93] mb-6">Alamat Tersimpan</h2>
      {local.addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {local.addresses.map(addr => (
            <div key={addr.id} className={`border rounded-lg p-5 flex flex-col justify-between ${local.editingAddress?.id === addr.id ? 'border-blue-500 ring-2 ring-blue-200' : ''}`}>
              <div>
                {addr.is_primary && <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full mb-2 inline-block">Alamat Utama</span>}
                <p className="font-semibold">{addr.fullname}</p>
                <p className="text-sm text-gray-600">{addr.phone}</p>
                <p className="text-sm text-gray-600 mt-2">{addr.address}</p>
                {addr.notes && <p className="text-sm text-gray-500 mt-1">Catatan: {addr.notes}</p>}
              </div>
              <div className="flex items-center gap-4 mt-4 border-t pt-4">
                <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => setupForm(addr)}>Ubah</Button>
                {/* UPDATED: Button now directly calls the delete handler */}
                <Button variant="link" className="p-0 h-auto text-red-600" onClick={() => handleDeleteAddress(addr.id)}>Hapus</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">Anda belum memiliki alamat tersimpan.</p>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#3B2C93]">{local.editingAddress ? 'Ubah Alamat' : 'Tambah Alamat Baru'}</h2>
          {local.editingAddress && <Button variant="outline" onClick={() => setupForm(null)}>+ Batal & Tambah Baru</Button>}
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="phoneNumber" render={({ field }) => ( <FormItem><FormLabel>Nomor Telepon</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="province" render={({ field }) => ( <FormItem><FormLabel>Provinsi</FormLabel><FormControl><ComboBox options={provincesData.map(p => ({ value: p.id || '', label: p.name || '' })).filter(option => option.value && option.label)} value={field.value} onValueChange={handleProvinceChange} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="city" render={({ field }) => ( <FormItem><FormLabel>Kota/Kabupaten</FormLabel><FormControl><ComboBox options={local.cities.map(c => ({ value: c.id || '', label: c.name || '' })).filter(option => option.value && option.label)} value={field.value} onValueChange={handleCityChange} disabled={local.loadingCities || !form.getValues("province")} /></FormControl><FormMessage /></FormItem> )} />
            
            <FormField control={form.control} name="district" render={({ field }) => ( <FormItem><FormLabel>Kecamatan</FormLabel><FormControl><ComboBox options={local.districts.map(d => ({ value: d.id || '', label: d.name || '' })).filter(option => option.value && option.label)} value={field.value} onValueChange={handleDistrictChange} disabled={local.loadingDistricts || !form.getValues("city")} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="village" render={({ field }) => ( <FormItem><FormLabel>Desa/Kelurahan</FormLabel><FormControl><ComboBox options={local.villages.map(v => ({ value: v.id || '', label: v.name || '' })).filter(option => option.value && option.label)} value={field.value} onValueChange={field.onChange} disabled={local.loadingVillages || !form.getValues("district")} /></FormControl><FormMessage /></FormItem> )} />
          </div>

          <FormField control={form.control} name="postalCode" render={({ field }) => ( <FormItem><FormLabel>Kode Pos</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
          <FormField control={form.control} name="streetDetail" render={({ field }) => ( <FormItem><FormLabel>Detail Alamat Jalan</FormLabel><FormControl><Textarea {...field} placeholder="Nama jalan, nomor rumah, RT/RW..."/></FormControl><FormMessage /></FormItem> )} />
          <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem><FormLabel>Catatan (Opsional)</FormLabel><FormControl><Textarea {...field} placeholder="Contoh: Patokan dekat masjid, rumah pagar hitam." /></FormControl></FormItem> )} />
          
          <FormField control={form.control} name="is_default" render={({ field }) => ( <FormItem className="flex items-center pt-2 space-x-3"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Jadikan alamat utama</FormLabel></FormItem> )} />
          <div className="flex justify-end pt-4"><Button type="submit" disabled={local.saving}>{local.saving ? "Menyimpan..." : "Simpan Alamat"}</Button></div>
        </form>
      </Form>
    </div>
  );
  
  if (local.isLoading) {
    return (
        <MainEsensiLayout header_config={header_config} mobile_menu={true}>
            <GlobalLoading />
        </MainEsensiLayout>
    );
  }

  return (
    <MainEsensiLayout header_config={header_config} mobile_menu={true}>
      <div className="flex justify-center p-6 lg:py-10 lg:px-0">
        <div className="flex flex-col w-full max-w-4xl">
          {renderAddressList()}
          <div className="border-t my-8"></div>
          {renderForm()}
        </div>
      </div>
    </MainEsensiLayout>
  );
};
