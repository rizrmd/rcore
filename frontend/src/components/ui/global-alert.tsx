import { proxy, useSnapshot } from "valtio";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Label } from "./label";
import { Checkbox } from "./checkbox";

interface AlertState {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  mode: "confirm" | "info";
  checkbox?: {
    label: string;
    checked: boolean;
  };
}

const alertState = proxy<AlertState>({
  isOpen: false,
  message: "",
  onConfirm: () => {},
  onCancel: () => {},
  mode: "confirm",
});

export const Alert = {
  confirm: (
    message: string,
    option?: { checkbox: string }
  ): Promise<{ confirm: boolean; checkbox?: boolean }> => {
    return new Promise((resolve) => {
      alertState.mode = "confirm";
      alertState.isOpen = true;
      alertState.message = message;

      if (option?.checkbox) {
        alertState.checkbox = {
          label: option.checkbox,
          checked: false,
        };
      } else {
        alertState.checkbox = undefined;
      }
      alertState.onConfirm = () => {
        alertState.isOpen = false;
        resolve({
          confirm: true,
          checkbox: alertState.checkbox
            ? alertState.checkbox.checked
            : undefined,
        });
        alertState.checkbox = undefined;
      };
      alertState.onCancel = () => {
        alertState.isOpen = false;
        resolve({
          confirm: false,
          checkbox: alertState.checkbox
            ? alertState.checkbox.checked
            : undefined,
        });
        alertState.checkbox = undefined;
      };
    });
  },
  info: (
    message: any,
    option?: { checkbox: string }
  ): Promise<boolean | void> => {
    return new Promise((resolve) => {
      alertState.mode = "info";
      alertState.isOpen = true;
      alertState.message = message;
      if (option?.checkbox) {
        alertState.checkbox = {
          label: option.checkbox,
          checked: false,
        };
      } else {
        alertState.checkbox = undefined;
      }
      alertState.onConfirm = () => {
        alertState.isOpen = false;
        resolve(alertState.checkbox ? alertState.checkbox.checked : undefined);
        alertState.checkbox = undefined;
      };
      // No cancel for info mode
      alertState.onCancel = () => {};
    });
  },
};

export function GlobalAlert() {
  const snap = useSnapshot(alertState);

  return (
    <AlertDialog open={snap.isOpen}>
      <AlertDialogContent className="select-none">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {snap.mode === "confirm" ? "Konfirmasi" : "Informasi"}
          </AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-wrap">
            {typeof snap.message === "object" ? (
              <span className="whitespace-pre-wrap wrap-anywhere font-mono">
                {JSON.stringify(snap.message, null, 2)}
              </span>
            ) : (
              snap.message
            )}
            {snap.checkbox && (
              <span className="flex items-center space-x-2 absolute bottom-[35px]">
                <Checkbox
                  id="checkbox"
                  checked={snap.checkbox.checked}
                  onCheckedChange={(checked) => {
                    alertState.checkbox!.checked = checked as boolean;
                  }}
                />
                <Label htmlFor="checkbox" className="font-normal text-xs">
                  {snap.checkbox.label}
                </Label>
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {snap.mode === "confirm" ? (
            <>
              <AlertDialogCancel
                className="cursor-pointer"
                onClick={snap.onCancel}
              >
                Tidak
              </AlertDialogCancel>
              <AlertDialogAction
                className="cursor-pointer"
                onClick={snap.onConfirm}
              >
                Ya
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={snap.onConfirm} autoFocus>
              OK
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
