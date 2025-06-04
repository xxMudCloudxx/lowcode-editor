import { type CommonComponentProps } from "../../interface";

function PageProd({ id, name, children, styles }: CommonComponentProps) {
  return (
    <div className="p-[20px]" style={{ ...styles }}>
      {children}
    </div>
  );
}

export default PageProd;
